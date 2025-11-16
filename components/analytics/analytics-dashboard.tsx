"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import type { ChartConfig } from "@/components/ui/chart";

type AnalyticsData = {
  dailySearches: Array<{ date: string; count: number }>;
  topQueries: Array<{ query: string | null; count: number }>;
  topProducts: Array<{
    productName: string | null;
    productSlug: string | null;
    count: number;
  }>;
  totalSearches: number;
  totalClicks: number;
};

export function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const hasActivity =
    data.totalSearches > 0 ||
    data.totalClicks > 0 ||
    data.dailySearches.length > 0;

  if (!hasActivity) {
    return (
      <div className="rounded-3xl border border-dashed bg-muted/30 p-10 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          No analytics yet
        </p>
        <p className="mt-2 text-base text-muted-foreground">
          Once shoppers start searching with Searchier, insights will appear
          here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Total Searches</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {data.totalSearches}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Product Clicks</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {data.totalClicks}
          </CardContent>
        </Card>
      </div>

      <Card className="py-4 sm:py-0">
        <CardHeader className="flex flex-col gap-1 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Searches per day</CardTitle>
            <p className="text-sm text-muted-foreground">
              Activity for the last 30 days
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-2 py-4 sm:p-6">
          <ChartContainer
            config={
              {
                count: { label: "Searches", color: "hsl(var(--chart-1))" },
              } satisfies ChartConfig
            }
            className="aspect-auto h-[260px] w-full"
          >
            <LineChart
              data={data.dailySearches}
              margin={{ left: 12, right: 12, top: 10, bottom: 10 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={20}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    }
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--color-count)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top queries</CardTitle>
            <CardDescription>Most frequent search terms</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={
                {
                  count: { label: "Searches", color: "var(--chart-2)" },
                } satisfies ChartConfig
              }
            >
              <BarChart
                accessibilityLayer
                data={data.topQueries.slice(0, 5).map((entry) => ({
                  ...entry,
                  query: entry.query ?? "—",
                }))}
                layout="vertical"
                margin={{ left: 0 }}
              >
                <YAxis
                  dataKey="query"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const label = value?.toString() ?? "";
                    return label.length > 20 ? `${label.slice(0, 20)}…` : label;
                  }}
                />
                <XAxis dataKey="count" type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="count" radius={5} fill="var(--chart-2)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most-clicked products</CardTitle>
            <CardDescription>Products shoppers love the most</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={
                {
                  count: { label: "Clicks", color: "var(--chart-3)" },
                } satisfies ChartConfig
              }
            >
              <BarChart
                accessibilityLayer
                data={data.topProducts.slice(0, 5).map((entry) => ({
                  ...entry,
                  productName: entry.productName ?? "Unknown",
                }))}
                layout="vertical"
                margin={{ left: 0 }}
              >
                <YAxis
                  dataKey="productName"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const label = value?.toString() ?? "";
                    return label.length > 20 ? `${label.slice(0, 20)}…` : label;
                  }}
                />
                <XAxis dataKey="count" type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="count" radius={5} fill="var(--chart-3)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
