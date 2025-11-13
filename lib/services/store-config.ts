import { storeConfig } from "@/lib/schema";
import { db } from "@/lib/drizzle";
import { eq, and } from "drizzle-orm";
import type { LightfunnelsStoreNode } from "@/lib/types/store";

export type StoreConfigRecord = typeof storeConfig.$inferSelect;

type UpsertConfigInput = {
  userId: string;
  store: Pick<
    LightfunnelsStoreNode,
    "id" | "name" | "primary_domain" | "defaultDomain"
  >;
  scriptUrl: string;
  scriptTag: string;
  installed: boolean;
};

export async function getStoreConfigs(userId: string) {
  return await db.query.storeConfig.findMany({
    where: eq(storeConfig.userId, userId),
    orderBy: (table, { desc }) => [desc(table.updatedAt)],
  });
}

export async function getStoreConfig(userId: string, storeId: string) {
  return await db.query.storeConfig.findFirst({
    where: and(
      eq(storeConfig.userId, userId),
      eq(storeConfig.storeId, storeId),
    ),
  });
}

export async function getInstalledStoreConfig(storeId: string) {
  return await db.query.storeConfig.findFirst({
    where: and(
      eq(storeConfig.storeId, storeId),
      eq(storeConfig.installed, true),
    ),
  });
}

export async function upsertStoreConfig({
  userId,
  store,
  scriptUrl,
  scriptTag,
  installed,
}: UpsertConfigInput) {
  const domain = store.primary_domain?.name ?? store.defaultDomain ?? null;
  const installedAt = installed ? new Date() : null;

  const [record] = await db
    .insert(storeConfig)
    .values({
      userId,
      storeId: store.id,
      storeName: store.name,
      storeDomain: domain,
      scriptUrl,
      scriptTag,
      installed,
      installedAt,
    })
    .onConflictDoUpdate({
      target: [storeConfig.userId, storeConfig.storeId],
      set: {
        storeName: store.name,
        storeDomain: domain,
        scriptUrl,
        scriptTag,
        installed,
        installedAt,
        updatedAt: new Date(),
      },
    })
    .returning();

  return record;
}
