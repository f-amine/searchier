import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { fetchStoresForUser } from "@/lib/services/stores";

export async function GET(request: Request) {
  const incomingHeaders = await headers();
  const session = await auth.api.getSession({
    headers: new Headers(incomingHeaders),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const search = url.searchParams.get("q") ?? undefined;
  const firstParam = url.searchParams.get("first");
  const first = firstParam ? Number(firstParam) : undefined;

  try {
    const data = await fetchStoresForUser({
      userId: session.user.id,
      search,
      cursor,
      first,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch Lightfunnels stores", error);
    return NextResponse.json(
      { error: "Failed to fetch Lightfunnels stores" },
      { status: 500 },
    );
  }
}
