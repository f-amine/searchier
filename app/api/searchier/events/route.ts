import { NextResponse } from "next/server";

import { getInstalledStoreConfig } from "@/lib/services/store-config";
import { logSearchEvent } from "@/lib/services/analytics";

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "*",
};

const corsResponse = (body: unknown, status = 200) =>
  new NextResponse(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      ...CORS_HEADERS,
    },
  });

export async function OPTIONS() {
  return corsResponse({});
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      storeId?: string;
      type?: "search" | "click";
      query?: string;
      resultsCount?: number;
      productId?: string;
      productName?: string;
      productSlug?: string;
    };

    if (!payload.storeId || !payload.type) {
      return corsResponse({ error: "Invalid payload" }, 400);
    }

    const config = await getInstalledStoreConfig(payload.storeId);
    if (!config) {
      return corsResponse({ error: "Store is not configured" }, 404);
    }

    await logSearchEvent({
      userId: config.userId,
      storeId: payload.storeId,
      type: payload.type,
      query: payload.query,
      resultsCount: payload.resultsCount,
      productId: payload.productId,
      productName: payload.productName,
      productSlug: payload.productSlug,
    });

    return corsResponse({ success: true });
  } catch (error) {
    console.error("Failed to log searchier event", error);
    return corsResponse({ error: "Failed to log event" }, 500);
  }
}
