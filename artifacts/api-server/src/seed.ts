import { db } from "@workspace/db";
import { usersTable, coinPackagesTable, botTemplatesTable, airdropsTable, promoCodesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seed() {
  // Admin user
  const [existingBera] = await db.select().from(usersTable).where(eq(usersTable.username, "bera")).limit(1);
  const [existingOldAdmin] = await db.select().from(usersTable).where(eq(usersTable.username, "admin")).limit(1);
  const hashed = await bcrypt.hash("brucebera7824_", 10);
  if (existingBera) {
    await db.update(usersTable).set({ role: "superadmin", password: hashed, coins: 999999, totalCoinsEarned: 999999, emailVerified: true }).where(eq(usersTable.username, "bera"));
    console.log("Admin updated");
  } else if (existingOldAdmin) {
    await db.update(usersTable).set({ username: "bera", role: "superadmin", password: hashed, coins: 999999, totalCoinsEarned: 999999, emailVerified: true }).where(eq(usersTable.username, "admin"));
    console.log("Admin renamed to bera and updated");
  } else {
    await db.insert(usersTable).values({
      username: "bera",
      password: hashed,
      role: "superadmin",
      coins: 999999,
      totalCoinsEarned: 999999,
      emailVerified: true,
      referralCode: "ADMINBERA2026",
    });
    console.log("Admin user created");
  }

  // Coin packages
  const [pkgCheck] = await db.select().from(coinPackagesTable).limit(1);
  if (!pkgCheck) {
    await db.insert(coinPackagesTable).values([
      { name: "Starter Pack", description: "100 coins to get you started", priceKsh: 100, coins: 100, bonusCoins: 10, badge: "Bronze" },
      { name: "Pro Pack", description: "500 coins with bonus", priceKsh: 450, coins: 500, bonusCoins: 75, badge: "Silver" },
      { name: "Elite Pack", description: "1000 coins - best value", priceKsh: 800, coins: 1000, bonusCoins: 200, badge: "Gold" },
      { name: "Whale Pack", description: "5000 coins - maximum value", priceKsh: 3500, coins: 5000, bonusCoins: 1250, badge: "Whale" },
    ]);
    console.log("Coin packages seeded");
  }

  // Bot templates
  const [botCheck] = await db.select().from(botTemplatesTable).limit(1);
  if (!botCheck) {
    await db.insert(botTemplatesTable).values([
      { name: "Telegram Bot Starter", description: "Simple Telegram bot template with node-telegram-bot-api", category: "telegram", runtime: "node", installCommand: "npm install", startCommand: "node index.js", branch: "main", coinCost: 0, featured: true, verified: true, deployCount: 142 },
      { name: "Discord Bot Starter", description: "Discord.js bot with slash commands support", category: "discord", runtime: "node", installCommand: "npm install", startCommand: "node bot.js", branch: "main", coinCost: 0, featured: true, verified: true, deployCount: 89 },
      { name: "WhatsApp Bot", description: "WhatsApp bot using baileys library", category: "whatsapp", runtime: "node", installCommand: "npm install", startCommand: "npm start", branch: "main", coinCost: 50, featured: true, verified: true, deployCount: 67 },
      { name: "Python Flask API", description: "REST API with Flask and SQLAlchemy", category: "api", runtime: "python", installCommand: "pip install -r requirements.txt", startCommand: "python app.py", branch: "main", coinCost: 0, featured: false, verified: true, deployCount: 45 },
      { name: "Crypto Price Bot", description: "Telegram bot for real-time crypto prices", category: "telegram", runtime: "node", installCommand: "npm install", startCommand: "node bot.js", branch: "main", coinCost: 25, featured: true, verified: true, deployCount: 201 },
      { name: "Group Management Bot", description: "Telegram group admin bot with auto-moderation", category: "telegram", runtime: "node", installCommand: "npm install", startCommand: "node index.js", branch: "main", coinCost: 0, featured: false, verified: true, deployCount: 33 },
    ]);
    console.log("Bot templates seeded");
  }

  // Airdrop
  const [dropCheck] = await db.select().from(airdropsTable).limit(1);
  if (!dropCheck) {
    await db.insert(airdropsTable).values({ title: "Welcome Airdrop", description: "Claim your free 25 coins welcome bonus!", coins: 25, target: "all" });
    console.log("Airdrop seeded");
  }

  // Promo code
  const [promoCheck] = await db.select().from(promoCodesTable).limit(1);
  if (!promoCheck) {
    await db.insert(promoCodesTable).values({ code: "BERA2026", coins: 100, discountPercent: 0, maxUses: 1000 });
    console.log("Promo BERA2026 seeded");
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
