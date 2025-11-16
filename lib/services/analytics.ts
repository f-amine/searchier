import { db } from "@/lib/drizzle";
import { searchEvent } from "@/lib/schema";
import { eq, and, desc, sql } from "drizzle-orm";

type LogEventInput = {
  userId: string;
  storeId: string;
  type: "search" | "click";
  query?: string;
  resultsCount?: number;
  productId?: string;
  productName?: string;
  productSlug?: string;
};

export async function logSearchEvent(input: LogEventInput) {
  await db.insert(searchEvent).values({
    userId: input.userId,
    storeId: input.storeId,
    type: input.type,
    query: input.query,
    resultsCount: input.resultsCount,
    productId: input.productId,
    productName: input.productName,
    productSlug: input.productSlug,
  });
}

export async function getAnalyticsSummary(userId: string) {
  const dailySearches = await db
    .select({
      date: sql<string>`date_trunc('day', ${searchEvent.createdAt})`,
      count: sql<number>`count(*)`,
    })
    .from(searchEvent)
    .where(
      and(eq(searchEvent.userId, userId), eq(searchEvent.type, "search")),
    )
    .groupBy(sql`date_trunc('day', ${searchEvent.createdAt})`)
    .orderBy(sql`date_trunc('day', ${searchEvent.createdAt})`)
    .limit(30);

  const topQueries = await db
    .select({
      query: searchEvent.query,
      count: sql<number>`count(*)`,
    })
    .from(searchEvent)
    .where(
      and(eq(searchEvent.userId, userId), eq(searchEvent.type, "search")),
    )
    .groupBy(searchEvent.query)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  const topProducts = await db
    .select({
      productName: searchEvent.productName,
      productSlug: searchEvent.productSlug,
      count: sql<number>`count(*)`,
    })
    .from(searchEvent)
    .where(
      and(eq(searchEvent.userId, userId), eq(searchEvent.type, "click")),
    )
    .groupBy(searchEvent.productName, searchEvent.productSlug)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  const totalSearches = await db
    .select({ count: sql<number>`count(*)` })
    .from(searchEvent)
    .where(
      and(eq(searchEvent.userId, userId), eq(searchEvent.type, "search")),
    )
    .then((rows) => rows[0]?.count ?? 0);

  const totalClicks = await db
    .select({ count: sql<number>`count(*)` })
    .from(searchEvent)
    .where(
      and(eq(searchEvent.userId, userId), eq(searchEvent.type, "click")),
    )
    .then((rows) => rows[0]?.count ?? 0);

  return {
    dailySearches,
    topQueries,
    topProducts,
    totalSearches,
    totalClicks,
  };
}
