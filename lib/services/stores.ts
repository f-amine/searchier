import lf from "@/lib/lf";
import { db } from "@/lib/drizzle";
import { account } from "@/lib/schema";
import {
  LightfunnelsStoreConnection,
  LightfunnelsStoreNode,
} from "@/lib/types/store";
import { and, eq } from "drizzle-orm";

const STORES_LIST_QUERY = `
  query storesListPaginationQuery($first: Int, $after: String, $query: String!) {
    ...storesListPagination
  }

  fragment storesListPagination on Query {
    pagination: channels(first: $first, after: $after, query: $query) {
      edges {
        node {
          __typename
          ... on Store {
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
          ... on Node {
            __isNode: __typename
            id
          }
        }
        cursor
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

type StoresQueryResponse = {
  pagination: LightfunnelsStoreConnection;
};

type FetchStoresOptions = {
  userId: string;
  search?: string;
  cursor?: string;
  first?: number;
};

const BASE_QUERY = "order_dir:desc excludeFunnels:true order_by:created_at";

const sanitizeSearch = (term: string) => term.replace(/"/g, "").trim();

const buildQueryString = (search?: string) => {
  if (!search) return BASE_QUERY;
  const clean = sanitizeSearch(search);
  if (!clean) return BASE_QUERY;
  return `${BASE_QUERY} search:"${clean}"`;
};

const clampFirst = (value?: number) => {
  const fallback = 20;
  if (!value) return fallback;
  return Math.min(Math.max(value, 1), 50);
};

async function getUserAccessToken(userId: string): Promise<string> {
  const record = await db.query.account.findFirst({
    where: and(
      eq(account.userId, userId),
      eq(account.providerId, "lightfunnels"),
    ),
  });

  const token = record?.lfAccessToken ?? record?.accessToken;

  if (!token) {
    throw new Error("Missing Lightfunnels access token for this user.");
  }

  return token;
}

export async function fetchStoresForUser({
  userId,
  search,
  cursor,
  first,
}: FetchStoresOptions): Promise<LightfunnelsStoreConnection> {
  const accessToken = await getUserAccessToken(userId);
  console.log(accessToken);

  const response = await lf<StoresQueryResponse>({
    token: accessToken,
    data: {
      query: STORES_LIST_QUERY,
      variables: {
        first: clampFirst(first),
        after: cursor ?? null,
        query: buildQueryString(search),
      },
    },
  });

  if (!response.data?.pagination) {
    throw new Error("Invalid Lightfunnels stores response.");
  }

  const filteredEdges = response.data.pagination.edges.filter(
    (edge): edge is { cursor: string; node: LightfunnelsStoreNode } =>
      edge.node.__typename === "Store",
  );

  return {
    edges: filteredEdges,
    pageInfo: response.data.pagination.pageInfo,
  };
}
