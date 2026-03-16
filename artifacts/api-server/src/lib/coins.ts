import { db } from "@workspace/db";
import { usersTable, transactionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

export async function awardCoins(
  userId: string,
  coins: number,
  type: string,
  description: string,
  meta?: Record<string, unknown>
): Promise<void> {
  await db.update(usersTable)
    .set({
      coins: sql`${usersTable.coins} + ${coins}`,
      totalCoinsEarned: sql`${usersTable.totalCoinsEarned} + ${Math.max(0, coins)}`,
    })
    .where(eq(usersTable.id, userId));

  await db.insert(transactionsTable).values({
    userId,
    type,
    coins,
    status: "completed",
    description,
    meta: meta as any,
  });
}

export async function spendCoins(
  userId: string,
  coins: number,
  type: string,
  description: string
): Promise<boolean> {
  const [user] = await db.select({ coins: usersTable.coins }).from(usersTable).where(eq(usersTable.id, userId));
  if (!user || user.coins < coins) return false;

  await db.update(usersTable)
    .set({ coins: sql`${usersTable.coins} - ${coins}` })
    .where(eq(usersTable.id, userId));

  await db.insert(transactionsTable).values({
    userId,
    type,
    coins: -coins,
    status: "completed",
    description,
  });

  return true;
}

export function getStreakReward(day: number): number {
  if (day >= 30) return 500;
  if (day >= 14) return 200;
  if (day >= 7) return 100;
  if (day >= 3) return 25;
  return 10;
}
