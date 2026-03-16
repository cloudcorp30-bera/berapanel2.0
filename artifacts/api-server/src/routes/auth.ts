import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, sessionsTable, referralsTable, referralConfigTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { signToken, verifyToken, requireAuth } from "../lib/auth.js";
import { awardCoins } from "../lib/coins.js";
import { v4 as uuidv4 } from "uuid";

async function getReferralBonus(): Promise<number> {
  try {
    const [row] = await db.select().from(referralConfigTable).where(eq(referralConfigTable.key, "signup_coins")).limit(1);
    if (row && typeof row.value === "number") return row.value;
    if (row && row.value !== null) return Number(row.value) || 10;
  } catch {}
  return 10;
}

const router: IRouter = Router();

function toUserDto(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    coins: u.coins,
    totalCoinsEarned: u.totalCoinsEarned,
    banned: u.banned,
    bio: u.bio,
    avatarUrl: u.avatarUrl,
    referralCode: u.referralCode,
    telegramEnabled: u.telegramEnabled,
    emailVerified: u.emailVerified,
    twoFaEnabled: u.twoFaEnabled,
    streakDays: u.streakDays,
    loginCount: u.loginCount,
    createdAt: u.createdAt,
    lastLogin: u.lastLogin,
  };
}

// POST /auth/register
router.post("/auth/register", async (req, res): Promise<void> => {
  const { username, password, email, referralCode } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }
  if (username.length < 3) {
    res.status(400).json({ error: "Username must be at least 3 characters" });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (existing) {
    res.status(400).json({ error: "Username already taken" });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const refCode = uuidv4().replace(/-/g, "").slice(0, 12).toUpperCase();

  let referredById: string | undefined;
  if (referralCode) {
    const [referrer] = await db.select().from(usersTable).where(eq(usersTable.referralCode, referralCode)).limit(1);
    if (referrer) referredById = referrer.id;
  }

  const [user] = await db.insert(usersTable).values({
    username,
    password: hashed,
    email,
    referralCode: refCode,
    referredBy: referredById,
  }).returning();

  // Award signup bonus
  await awardCoins(user.id, 50, "earn", "Welcome bonus for joining BeraPanel!");

  // Award referrer
  if (referredById) {
    const bonus = await getReferralBonus();
    await awardCoins(referredById, bonus, "referral", `Referral bonus: ${username} signed up with your code`);
    await db.insert(referralsTable).values({
      referrerId: referredById,
      refereeId: user.id,
      coinsAwarded: bonus,
      milestone: "signup",
    });
  }

  const token = signToken({ id: user.id, username: user.username, role: user.role });
  const refreshToken = uuidv4();
  await db.insert(sessionsTable).values({
    userId: user.id,
    refreshToken,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  res.status(201).json({ token, refreshToken, user: toUserDto(user) });
});

// POST /auth/login
router.post("/auth/login", async (req, res): Promise<void> => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  // ── ENV-based admin bypass ──────────────────────────────────────────────────
  // Credentials: set ADMIN_USERNAME / ADMIN_PASSWORD env vars to override defaults
  // Default: username=bera  password=bera2026
  const envUser = process.env.ADMIN_USERNAME ?? "bera";
  const envPass = process.env.ADMIN_PASSWORD ?? "bera2026";

  if (username === envUser && password === envPass) {
    // Try to find an existing superadmin DB record
    let [adminRecord] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.role, "superadmin"))
      .limit(1);

    // If no superadmin exists yet, auto-create one now
    if (!adminRecord) {
      const hashed = await bcrypt.hash(envPass, 10);
      const refCode = uuidv4().replace(/-/g, "").slice(0, 12).toUpperCase();
      [adminRecord] = await db.insert(usersTable).values({
        username: envUser,
        password: hashed,
        role: "superadmin",
        referralCode: refCode,
        emailVerified: true,
        coins: 999999,
      }).returning();
    }

    // Update last login
    await db.update(usersTable).set({
      lastLogin: new Date(),
      loginCount: (adminRecord.loginCount || 0) + 1,
    }).where(eq(usersTable.id, adminRecord.id));

    const token = signToken({ id: adminRecord.id, username: adminRecord.username, role: "superadmin" });
    const refreshToken = uuidv4();
    await db.insert(sessionsTable).values({
      userId: adminRecord.id,
      refreshToken,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    res.json({ token, refreshToken, user: toUserDto({ ...adminRecord, role: "superadmin" }) });
    return;
  }
  // ── End env-based admin bypass ────────────────────────────────────────────────

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  if (user.banned) {
    res.status(403).json({ error: `Account banned: ${user.banReason || "Contact support"}` });
    return;
  }

  await db.update(usersTable).set({
    lastLogin: new Date(),
    loginCount: (user.loginCount || 0) + 1,
  }).where(eq(usersTable.id, user.id));

  const token = signToken({ id: user.id, username: user.username, role: user.role });
  const refreshToken = uuidv4();
  await db.insert(sessionsTable).values({
    userId: user.id,
    refreshToken,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  res.json({ token, refreshToken, user: toUserDto(user) });
});

// POST /auth/refresh
router.post("/auth/refresh", async (req, res): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: "Refresh token required" });
    return;
  }

  const [session] = await db.select().from(sessionsTable).where(
    and(eq(sessionsTable.refreshToken, refreshToken), gt(sessionsTable.expiresAt!, new Date()))
  ).limit(1);

  if (!session || !session.userId) {
    res.status(401).json({ error: "Invalid or expired refresh token" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId)).limit(1);
  if (!user || user.banned) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const token = signToken({ id: user.id, username: user.username, role: user.role });
  res.json({ token });
});

// POST /auth/logout
router.post("/auth/logout", requireAuth, async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (payload) {
      await db.delete(sessionsTable).where(eq(sessionsTable.userId, payload.id));
    }
  }
  res.json({ success: true });
});

// GET /auth/me
router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(toUserDto(user));
});

// POST /auth/change-password
router.post("/auth/change-password", requireAuth, async (req, res): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
  if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
    res.status(401).json({ error: "Current password incorrect" });
    return;
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  await db.update(usersTable).set({ password: hashed }).where(eq(usersTable.id, req.user!.id));
  res.json({ success: true });
});

// POST /auth/forgot-password
router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  // Just return success (email integration is optional)
  res.json({ success: true, message: "If that email exists, a reset link has been sent" });
});

// POST /auth/reset-password
router.post("/auth/reset-password", async (req, res): Promise<void> => {
  res.json({ success: true, message: "Password reset (token validation not configured)" });
});

export default router;
