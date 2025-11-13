import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getUserLightfunnelsToken } from "@/lib/services/lightfunnels-token";
import {
  getStoreConfigs,
  getStoreConfig,
  upsertStoreConfig,
} from "@/lib/services/store-config";
import { injectScriptIntoStore, removeScriptFromStore } from "@/lib/lf";
import type { LightfunnelsStoreNode } from "@/lib/types/store";

const getScriptUrl = () => {
  const base = process.env.BETTER_AUTH_URL!;

  const normalized = base.replace(/\/$/, "");
  return `${normalized}/searchier.js`;
};

const buildScriptTag = (scriptUrl: string, store: LightfunnelsStoreNode) => {
  return `<script src="${scriptUrl}" data-searchier-store="${store.id}" data-searchier-store-slug="${store.slug}" defer></script>`;
};

const parseBody = async (request: Request) => {
  const body = await request.json();
  return body as {
    store?: LightfunnelsStoreNode;
  };
};

export async function GET() {
  const incomingHeaders = await headers();
  const session = await auth.api.getSession({
    headers: new Headers(incomingHeaders),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configs = await getStoreConfigs(session.user.id);
  return NextResponse.json(configs);
}

export async function POST(request: Request) {
  const incomingHeaders = await headers();
  const session = await auth.api.getSession({
    headers: new Headers(incomingHeaders),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { store } = await parseBody(request);

  if (!store?.id) {
    return NextResponse.json(
      { error: "Missing store information" },
      { status: 400 },
    );
  }

  try {
    const { token } = await getUserLightfunnelsToken(session.user.id);
    const scriptUrl = getScriptUrl();
    const scriptTag = buildScriptTag(scriptUrl, store);

    await injectScriptIntoStore(token, store.id, scriptTag);

    const config = await upsertStoreConfig({
      userId: session.user.id,
      store,
      scriptUrl,
      scriptTag,
      installed: true,
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Failed to install Searchier", error);
    return NextResponse.json(
      { error: "Failed to install Searchier script" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const incomingHeaders = await headers();
  const session = await auth.api.getSession({
    headers: new Headers(incomingHeaders),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { store } = await parseBody(request);

  if (!store?.id) {
    return NextResponse.json(
      { error: "Missing store information" },
      { status: 400 },
    );
  }

  try {
    const existing = await getStoreConfig(session.user.id, store.id);
    const { token } = await getUserLightfunnelsToken(session.user.id);
    const scriptUrl = existing?.scriptUrl ?? getScriptUrl();

    await removeScriptFromStore(token, store.id, scriptUrl);

    const config = await upsertStoreConfig({
      userId: session.user.id,
      store,
      scriptUrl,
      scriptTag: buildScriptTag(scriptUrl, store),
      installed: false,
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Failed to remove Searchier script", error);
    return NextResponse.json(
      { error: "Failed to remove Searchier script" },
      { status: 500 },
    );
  }
}
