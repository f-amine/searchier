import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getAnalyticsSummary } from "@/lib/services/analytics";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export default async function AnalyticsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  const data = await getAnalyticsSummary(session.user.id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div>
        <p className="text-sm text-muted-foreground">Analytics</p>
        <h1 className="text-2xl font-semibold">
          See how shoppers use Searchier
        </h1>
      </div>
      <AnalyticsDashboard data={data} />
    </main>
  );
}
