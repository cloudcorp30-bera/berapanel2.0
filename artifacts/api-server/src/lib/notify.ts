import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string = "info",
  category: string = "general",
  actionUrl?: string
): Promise<void> {
  await db.insert(notificationsTable).values({
    userId,
    title,
    message,
    type,
    category,
    actionUrl,
  });
}

export async function notifyAdmin(title: string, message: string): Promise<void> {
  // Telegram admin notification
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (token && chatId) {
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: `[BeraPanel] ${title}\n${message}` }),
      });
    } catch {}
  }
}
