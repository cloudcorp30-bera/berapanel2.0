import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  transactionsTable,
  coinPackagesTable,
  airdropsTable,
  airdropClaimsTable,
  referralsTable,
  promoCodesTable,
  promoUsesTable,
  coinTransfersTable,
} from "@workspace/db";
import { eq, and, desc, gte, sql, lt, ne } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { awardCoins, spendCoins, getStreakReward } from "../lib/coins.js";
import { createNotification } from "../lib/notify.js";

const router: IRouter = Router();

// GET /coins/balance
router.get("/coins/balance", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select({ coins: usersTable.coins, totalCoinsEarned: usersTable.totalCoinsEarned })
    .from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
  res.json({ coins: user?.coins || 0, totalEarned: user?.totalCoinsEarned || 0 });
});

// GET /coins/history
router.get("/coins/history", requireAuth, async (req, res): Promise<void> => {
  const page = parseInt(req.query.page as string || "1");
  const limit = 20;
  const offset = (page - 1) * limit;
  const transactions = await db.select().from(transactionsTable)
    .where(eq(transactionsTable.userId, req.user!.id))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(limit).offset(offset);
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(transactionsTable).where(eq(transactionsTable.userId, req.user!.id));
  res.json({ transactions, total: Number(count) });
});

// POST /coins/transfer
router.post("/coins/transfer", requireAuth, async (req, res): Promise<void> => {
  const { toUsername, coins, note } = req.body;
  if (!toUsername || !coins || coins <= 0) {
    res.status(400).json({ error: "Invalid transfer request" });
    return;
  }
  const [target] = await db.select().from(usersTable).where(eq(usersTable.username, toUsername)).limit(1);
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (target.id === req.user!.id) {
    res.status(400).json({ error: "Cannot transfer to yourself" });
    return;
  }
  const ok = await spendCoins(req.user!.id, coins, "transfer", `Sent ${coins} coins to ${toUsername}${note ? `: ${note}` : ""}`);
  if (!ok) {
    res.status(400).json({ error: "Insufficient coins" });
    return;
  }
  await awardCoins(target.id, coins, "transfer", `Received ${coins} coins from ${req.user!.username}${note ? `: ${note}` : ""}`);
  await db.insert(coinTransfersTable).values({ fromUserId: req.user!.id, toUserId: target.id, coins, note });
  await createNotification(target.id, "Coins Received!", `${req.user!.username} sent you ${coins} coins`, "success", "billing");
  res.json({ success: true });
});

// GET /coins/leaderboard
router.get("/coins/leaderboard", async (req, res): Promise<void> => {
  const users = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    avatarUrl: usersTable.avatarUrl,
    coins: usersTable.coins,
    role: usersTable.role,
  }).from(usersTable).where(eq(usersTable.banned, false)).orderBy(desc(usersTable.coins)).limit(50);
  res.json(users.map((u, i) => ({ ...u, rank: i + 1, deployCount: 0 })));
});

// GET /coins/earn-options
router.get("/coins/earn-options", async (req, res): Promise<void> => {
  res.json([
    { id: "signup", title: "Join BeraPanel", description: "Sign up and get 50 coins", coins: 50, type: "bonus", completed: true },
    { id: "first_deploy", title: "First Deploy", description: "Deploy your first project", coins: 100, type: "milestone", completed: false },
    { id: "daily_streak", title: "Daily Login Streak", description: "Log in every day for bonus coins", coins: 10, type: "streak", completed: false },
    { id: "referral", title: "Refer a Friend", description: "Earn 50 coins per referral signup", coins: 50, type: "referral", completed: false },
    { id: "add_email", title: "Add Email", description: "Verify your email address", coins: 25, type: "task", completed: false },
    { id: "telegram", title: "Connect Telegram", description: "Link your Telegram account", coins: 25, type: "task", completed: false },
    { id: "promo_code", title: "Redeem Promo Code", description: "Enter a valid promo code", coins: 0, type: "promo", completed: false },
  ]);
});

// GET /subscribe/plans
router.get("/subscribe/plans", async (req, res): Promise<void> => {
  const packages = await db.select().from(coinPackagesTable).where(eq(coinPackagesTable.enabled, true));
  res.json(packages);
});

// POST /subscribe/initiate
router.post("/subscribe/initiate", requireAuth, async (req, res): Promise<void> => {
  const { packageId, phone } = req.body;
  if (!packageId || !phone) {
    res.status(400).json({ error: "Package ID and phone required" });
    return;
  }
  const [pkg] = await db.select().from(coinPackagesTable).where(eq(coinPackagesTable.id, packageId)).limit(1);
  if (!pkg || !pkg.enabled) {
    res.status(404).json({ error: "Package not found" });
    return;
  }

  // Create pending transaction
  const [tx] = await db.insert(transactionsTable).values({
    userId: req.user!.id,
    type: "purchase",
    planId: packageId,
    amountKsh: pkg.priceKsh,
    coins: (pkg.coins || 0) + (pkg.bonusCoins || 0),
    phone,
    status: "pending",
    description: `Purchase: ${pkg.name}`,
  }).returning();

  // Initiate PayHero STK Push
  const payheroAuth = process.env.PAYHERO_AUTH;
  const channelId = process.env.PAYHERO_CHANNEL_ID || "3762";
  const baseUrl = process.env.PAYHERO_BASE || "https://backend.payhero.co.ke/api/v2";
  const callbackUrl = `${process.env.BASE_URL || ""}/api/brucepanel/subscribe/callback`;

  if (payheroAuth) {
    try {
      const stkRes = await fetch(`${baseUrl}/payments`, {
        method: "POST",
        headers: {
          "Authorization": payheroAuth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: pkg.priceKsh,
          phone_number: phone,
          channel_id: parseInt(channelId),
          provider: "m-pesa",
          external_reference: tx.id,
          customer_name: req.user!.username,
          callback_url: callbackUrl,
        }),
      });
      const stkData = await stkRes.json() as any;
      const checkoutRequestId = stkData?.CheckoutRequestID || tx.id;
      await db.update(transactionsTable).set({ checkoutRequestId }).where(eq(transactionsTable.id, tx.id));
      res.json({ checkoutRequestId, transactionId: tx.id, message: "STK Push sent to your phone" });
      return;
    } catch {}
  }

  // Demo mode: auto-complete
  const coins = (pkg.coins || 0) + (pkg.bonusCoins || 0);
  await awardCoins(req.user!.id, coins, "purchase", `Purchased ${pkg.name} (${coins} coins)`);
  await db.update(transactionsTable).set({ status: "completed", checkoutRequestId: tx.id }).where(eq(transactionsTable.id, tx.id));
  res.json({ checkoutRequestId: tx.id, transactionId: tx.id, message: "Payment processed (demo mode)" });
});

// GET /subscribe/status/:checkoutRequestId
router.get("/subscribe/status/:checkoutRequestId", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.checkoutRequestId) ? req.params.checkoutRequestId[0] : req.params.checkoutRequestId;
  const [tx] = await db.select().from(transactionsTable).where(eq(transactionsTable.checkoutRequestId, id)).limit(1);
  res.json({ status: tx?.status || "not_found", coins: tx?.coins, message: tx?.description });
});

// POST /subscribe/callback (PayHero webhook)
router.post("/subscribe/callback", async (req, res): Promise<void> => {
  try {
    const body = req.body;
    const ref = body?.external_reference || body?.ExternalReference;
    const status = body?.Status || body?.status;

    if (ref && status === "SUCCESS") {
      const [tx] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, ref)).limit(1);
      if (tx && tx.status === "pending") {
        const coins = tx.coins || 0;
        await awardCoins(tx.userId, coins, "purchase", `M-Pesa payment completed: ${coins} coins`);
        await db.update(transactionsTable).set({ status: "completed" }).where(eq(transactionsTable.id, ref));
        await createNotification(tx.userId, "Payment Successful!", `Your ${coins} coins have been credited.`, "success", "billing");
      }
    }
  } catch {}
  res.json({ status: "ok" });
});

// GET /subscribe/history
router.get("/subscribe/history", requireAuth, async (req, res): Promise<void> => {
  const txns = await db.select().from(transactionsTable)
    .where(and(eq(transactionsTable.userId, req.user!.id), eq(transactionsTable.type, "purchase")))
    .orderBy(desc(transactionsTable.createdAt)).limit(50);
  res.json(txns);
});

// GET /airdrops
router.get("/airdrops", requireAuth, async (req, res): Promise<void> => {
  const now = new Date();
  const airdrops = await db.select().from(airdropsTable);
  const claims = await db.select().from(airdropClaimsTable).where(eq(airdropClaimsTable.userId, req.user!.id));
  const claimedIds = new Set(claims.map(c => c.airdropId));

  const active = airdrops.filter(a => {
    if (a.expiresAt && new Date(a.expiresAt) < now) return false;
    if (a.startsAt && new Date(a.startsAt) > now) return false;
    if (a.maxClaims && (a.claimCount || 0) >= a.maxClaims) return false;
    return true;
  }).map(a => ({ ...a, claimed: claimedIds.has(a.id) }));

  res.json(active);
});

// POST /airdrops/:id/claim
router.post("/airdrops/:id/claim", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [airdrop] = await db.select().from(airdropsTable).where(eq(airdropsTable.id, id)).limit(1);
  if (!airdrop) {
    res.status(404).json({ error: "Airdrop not found" });
    return;
  }
  const [existing] = await db.select().from(airdropClaimsTable)
    .where(and(eq(airdropClaimsTable.airdropId, id), eq(airdropClaimsTable.userId, req.user!.id))).limit(1);
  if (existing) {
    res.status(400).json({ error: "Already claimed" });
    return;
  }
  await db.insert(airdropClaimsTable).values({ airdropId: id, userId: req.user!.id });
  await db.update(airdropsTable).set({ claimCount: (airdrop.claimCount || 0) + 1 }).where(eq(airdropsTable.id, id));
  await awardCoins(req.user!.id, airdrop.coins || 0, "airdrop", `Claimed airdrop: ${airdrop.title}`);
  res.json({ success: true, coinsAwarded: airdrop.coins });
});

// GET /airdrops/history
router.get("/airdrops/history", requireAuth, async (req, res): Promise<void> => {
  const claims = await db.select().from(airdropClaimsTable)
    .where(eq(airdropClaimsTable.userId, req.user!.id))
    .orderBy(desc(airdropClaimsTable.claimedAt));
  res.json(claims);
});

// GET /referral/info
router.get("/referral/info", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
  const refs = await db.select().from(referralsTable).where(eq(referralsTable.referrerId, req.user!.id));
  const totalCoins = refs.reduce((s, r) => s + (r.coinsAwarded || 0), 0);
  const baseUrl = process.env.BASE_URL || "https://yourdomain.com";
  const code = user?.referralCode || "";
  res.json({
    code,
    link: `${baseUrl}/register?ref=${code}`,
    totalReferrals: refs.length,
    coinsEarned: totalCoins,
    history: refs.map(r => ({ refereeUsername: "", milestone: r.milestone, coinsAwarded: r.coinsAwarded, createdAt: r.createdAt })),
  });
});

// GET /referral/leaderboard
router.get("/referral/leaderboard", async (req, res): Promise<void> => {
  const results = await db.select({
    referrerId: referralsTable.referrerId,
    count: sql<number>`count(*)`,
  }).from(referralsTable).groupBy(referralsTable.referrerId).orderBy(desc(sql`count(*)`)).limit(50);
  res.json(results.map((r, i) => ({ rank: i + 1, userId: r.referrerId, username: "", coins: 0, role: "user", deployCount: Number(r.count) })));
});

// GET /streak/status
router.get("/streak/status", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
  const now = new Date();
  const lastClaim = user?.lastStreakClaim;
  const canClaim = !lastClaim || (now.getTime() - new Date(lastClaim).getTime()) > 22 * 60 * 60 * 1000;
  const streak = user?.streakDays || 0;
  const reward = getStreakReward(streak + 1);
  let nextClaimAt: Date | null = null;
  if (lastClaim && !canClaim) {
    nextClaimAt = new Date(new Date(lastClaim).getTime() + 24 * 60 * 60 * 1000);
  }
  res.json({ currentStreak: streak, canClaim, nextClaimAt, reward });
});

// POST /streak/claim
router.post("/streak/claim", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
  const now = new Date();
  const lastClaim = user?.lastStreakClaim;
  const canClaim = !lastClaim || (now.getTime() - new Date(lastClaim).getTime()) > 22 * 60 * 60 * 1000;
  if (!canClaim) {
    res.status(400).json({ error: "Already claimed today" });
    return;
  }

  // Check if streak is broken (> 36h since last)
  const broken = lastClaim && (now.getTime() - new Date(lastClaim).getTime()) > 36 * 60 * 60 * 1000;
  const newStreak = broken ? 1 : (user?.streakDays || 0) + 1;
  const reward = getStreakReward(newStreak);

  await db.update(usersTable).set({ streakDays: newStreak, lastStreakClaim: now }).where(eq(usersTable.id, req.user!.id));
  await awardCoins(req.user!.id, reward, "streak", `Day ${newStreak} streak reward`);

  const [updatedUser] = await db.select({ coins: usersTable.coins }).from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
  res.json({ coinsAwarded: reward, newStreak, newBalance: updatedUser?.coins || 0 });
});

// POST /promo/redeem
router.post("/promo/redeem", requireAuth, async (req, res): Promise<void> => {
  const { code } = req.body;
  if (!code) {
    res.status(400).json({ error: "Code required" });
    return;
  }
  const [promo] = await db.select().from(promoCodesTable).where(eq(promoCodesTable.code, code.toUpperCase())).limit(1);
  if (!promo) {
    res.status(404).json({ error: "Invalid promo code" });
    return;
  }
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    res.status(400).json({ error: "Promo code expired" });
    return;
  }
  if (promo.maxUses && (promo.uses || 0) >= promo.maxUses) {
    res.status(400).json({ error: "Promo code exhausted" });
    return;
  }
  if (promo.onePerUser) {
    const [used] = await db.select().from(promoUsesTable)
      .where(and(eq(promoUsesTable.code, code.toUpperCase()), eq(promoUsesTable.userId, req.user!.id))).limit(1);
    if (used) {
      res.status(400).json({ error: "Already used this code" });
      return;
    }
  }

  await db.insert(promoUsesTable).values({ code: code.toUpperCase(), userId: req.user!.id });
  await db.update(promoCodesTable).set({ uses: (promo.uses || 0) + 1 }).where(eq(promoCodesTable.code, code.toUpperCase()));
  if (promo.coins) {
    await awardCoins(req.user!.id, promo.coins, "promo", `Promo code: ${code.toUpperCase()}`);
  }
  res.json({ success: true, coinsAwarded: promo.coins || 0, message: `Redeemed! ${promo.coins || 0} coins added.` });
});

// GET /leaderboard
router.get("/leaderboard", async (req, res): Promise<void> => {
  const users = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    avatarUrl: usersTable.avatarUrl,
    coins: usersTable.coins,
    role: usersTable.role,
  }).from(usersTable).where(eq(usersTable.banned, false)).orderBy(desc(usersTable.coins)).limit(50);
  res.json(users.map((u, i) => ({ ...u, rank: i + 1, deployCount: 0 })));
});

// GET /badges
router.get("/badges", async (req, res): Promise<void> => {
  res.json([
    { id: "early_adopter", name: "Early Adopter", description: "Joined in the first month", icon: "🌟", rarity: "legendary" },
    { id: "deployer_10", name: "Deployer", description: "Made 10 deployments", icon: "🚀", rarity: "rare" },
    { id: "whale", name: "Whale", description: "Purchased over 10,000 coins", icon: "🐳", rarity: "epic" },
    { id: "streak_30", name: "Streak Master", description: "30-day login streak", icon: "🔥", rarity: "epic" },
    { id: "referrer_10", name: "Connector", description: "Referred 10 users", icon: "🤝", rarity: "rare" },
  ]);
});

export default router;
