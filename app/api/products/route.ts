import { NextResponse } from "next/server";

import { fetchStoreProducts } from "@/lib/services/products";
import { getInstalledStoreConfig } from "@/lib/services/store-config";

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "*",
};

const corsJson = (body: unknown, status = 200) =>
  new NextResponse(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      ...CORS_HEADERS,
    },
  });

export async function OPTIONS() {
  return corsJson({});
}

export async function GET(request: Request) {

  const url = new URL(request.url);
  const storeId = url.searchParams.get("storeId") ?? undefined;
  const search = url.searchParams.get("q") ?? undefined;
  const after = url.searchParams.get("cursor") ?? undefined;
  const firstParam = url.searchParams.get("first");
  const first = firstParam ? Number(firstParam) : undefined;

  if (!storeId) {
    return corsJson({ error: "storeId is required" }, 400);
  }

  try {
    const config = await getInstalledStoreConfig(storeId);

    if (!config) {
      return corsJson({ error: "Store is not configured" }, 404);
    }

    const data = await fetchStoreProducts({
      userId: config.userId,
      storeId,
      search,
      after,
      first,
    });

    return corsJson(data);
  } catch (error) {
    console.error("Failed to fetch Lightfunnels products", error);
    return corsJson({ error: "Failed to fetch products" }, 500);
  }
}
