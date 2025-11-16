import { db } from "@/lib/drizzle";
import { account } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

export async function getUserLightfunnelsToken(userId: string) {
  const record = await db.query.account.findFirst({
    where: and(
      eq(account.userId, userId),
      eq(account.providerId, "lightfunnels"),
    ),
  });

  const token = record?.accessToken;

  if (!token) {
    throw new Error("Missing Lightfunnels access token for this user.");
  }

  return {
    token,
    accountId: record?.accountId ?? null,
  };
}
