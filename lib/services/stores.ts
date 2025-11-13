import lf from "@/lib/lf";
import {
  LightfunnelsStoreConnection,
  LightfunnelsStoreNode,
} from "@/lib/types/store";
import { getUserLightfunnelsToken } from "@/lib/services/lightfunnels-token";

const ACCOUNT_STORES_QUERY = `
  query AccountStoresQuery {
    account {
      stores {
        id
        uid: id
        name
        defaultDomain
        slug
        published
        currency
        currency_format
        primary_domain {
          id
          name
        }
        channelTemplate {
          starting_step_id
          template {
            id
            name
            desktop_thumbnail
            mobile_thumbnail
          }
          id
        }
        funnel {
          id
          destinationTemplate {
            uid: id
            id
          }
        }
      }
    }
  }
`;

type StoresQueryResponse = {
  account?: {
    stores: LightfunnelsStoreNode[];
  } | null;
};

type FetchStoresOptions = {
  userId: string;
  search?: string;
  cursor?: string;
  first?: number;
};

const clampFirst = (value?: number) => {
  const fallback = 20;
  if (!value) return fallback;
  return Math.min(Math.max(value, 1), 50);
};

const matchesSearch = (store: LightfunnelsStoreNode, term?: string) => {
  if (!term) return true;
  const target = term.toLowerCase();
  const haystack = [
    store.name,
    store.slug,
    store.primary_domain?.name,
    store.defaultDomain,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(target);
};

export async function fetchStoresForUser({
  userId,
  search,
  cursor,
  first,
}: FetchStoresOptions): Promise<LightfunnelsStoreConnection> {
  const { token: accessToken } = await getUserLightfunnelsToken(userId);

  const response = await lf<StoresQueryResponse>({
    token: accessToken,
    data: {
      query: ACCOUNT_STORES_QUERY,
    },
  });

  const stores = response.data?.account?.stores ?? [];
  const normalizedSearch = search?.trim();
  const filtered = stores.filter((store) =>
    matchesSearch(store, normalizedSearch),
  );

  const startIndex = cursor
    ? Math.max(filtered.findIndex((store) => store.id === cursor) + 1, 0)
    : 0;

  const limit = clampFirst(first);
  const slice = filtered.slice(startIndex, startIndex + limit);
  const endCursor = slice.at(-1)?.id ?? null;
  const hasNextPage = startIndex + limit < filtered.length;

  return {
    edges: slice.map((store) => ({
      cursor: store.id,
      node: store,
    })),
    pageInfo: {
      endCursor,
      hasNextPage,
    },
  };
}
