import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
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
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <section className="rounded-3xl border bg-card p-8 shadow-sm">
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="mt-2 text-3xl font-semibold">{user?.name ?? "—"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Keep track of how shoppers are using Searchier across your stores.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border bg-background/40 p-4">
            <p className="text-sm text-muted-foreground">Connected stores</p>
            <p className="text-3xl font-semibold">{configs.length}</p>
          </div>
          <div className="rounded-2xl border bg-background/40 p-4">
            <p className="text-sm text-muted-foreground">Last updated</p>
            <p className="text-xl font-medium">
              {configs[0]?.updatedAt?.toLocaleDateString?.() ?? "—"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          href="/app/stores"
          className="rounded-3xl border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
          <p className="text-sm font-medium text-muted-foreground">Setup</p>
          <h2 className="mt-2 text-xl font-semibold">Manage store installs</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Install or remove Searchier on any Lightfunnels storefront.
          </p>
        </Link>
        <Link
          href="/app/analytics"
          className="rounded-3xl border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
          <p className="text-sm font-medium text-muted-foreground">Insights</p>
          <h2 className="mt-2 text-xl font-semibold">View analytics</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            See top searches, clicks, and daily usage.
          </p>
        </Link>
      </section>

      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-primary uppercase tracking-wide">
            Installation checklist
          </p>
          <h2 className="text-xl font-semibold">Add the widget to your pages</h2>
          <p className="text-sm text-muted-foreground">
            Follow the steps below to activate Searchier inside the Lightfunnels builder.
          </p>
        </div>
        <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">1.</span> Install the script on a store from{" "}
            <Link href="/app/stores" className="text-primary underline">
              the Stores tab
            </Link>
            .
          </li>
          <li>
            <span className="font-medium text-foreground">2.</span> In the Lightfunnels builder, drop an input element or icon
            and set its attribute <code className="rounded bg-muted px-1">id="searchier"</code> (or add{" "}
            <code className="rounded bg-muted px-1">data-searchier</code>).
          </li>
          <li>
            <span className="font-medium text-foreground">3.</span> Publish your changes. Clicking the trigger will open
            the floating Searchier modal on your storefront.
          </li>
        </ol>
      </section>
    </main>
  );
}
