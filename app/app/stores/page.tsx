import { headers } from "next/headers";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { getStoreConfigs } from "@/lib/services/store-config";
import { StoreManager } from "@/components/store/store-manager";

export default async function StoresPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  const configs = await getStoreConfigs(session.user.id);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Store Configuration</h1>
        <p className="text-sm text-muted-foreground">
          Install or remove the Searchier script from any Lightfunnels store.
        </p>
      </div>
      <StoreManager initialConfigs={configs} />

      <div className="rounded-xl border bg-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Installed stores
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {configs.map((config) => (
            <li key={config.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{config.storeName}</p>
                  <p className="text-muted-foreground">
                    {config.storeDomain ?? config.storeId}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {config.installed ? "Active" : "Disabled"}
                </span>
              </div>
            </li>
          ))}
          {configs.length === 0 && (
            <li className="text-muted-foreground">No stores connected yet.</li>
          )}
        </ul>
      </div>
    </main>
  );
}
