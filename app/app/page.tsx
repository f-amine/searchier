import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { StoreManager } from "@/components/store/store-manager";
import { getStoreConfigs } from "@/lib/services/store-config";

export default async function AppPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <h1 className="text-2xl font-semibold">No active session</h1>
        <p className="text-muted-foreground">
          Head back to the homepage to sign in with Lightfunnels.
        </p>
      </div>
    );
  }

  const { user } = session;
  const configs = await getStoreConfigs(user.id);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-xl rounded-2xl border bg-card p-8 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          Signed in as
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{user?.name ?? "—"}</h1>

        <dl className="mt-8 space-y-4 text-sm">
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">Account ID</dt>
            <dd className="font-mono text-base">{user?.id ?? "—"}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="text-base">{user?.email ?? "—"}</dd>
          </div>
        </dl>
        <div className="mt-10 space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              Select a store
            </p>
            <p className="text-sm text-muted-foreground">
              Choose the Lightfunnels store where you want to install the
              Searchier script.
            </p>
          </div>
          <StoreManager initialConfigs={configs} />
        </div>
      </div>
    </div>
  );
}
