import lf from "@/lib/lf";
import { getUserLightfunnelsToken } from "@/lib/services/lightfunnels-token";
import { ProductConnection, LightfunnelsProduct } from "@/lib/types/product";

const PRODUCTS_QUERY = `
  query getProducts($query: String!, $first: Int, $after: String) {
    products(query: $query, first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          slug
          name: title
          thumbnail {
            path(version: version1)
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

type FetchProductsOptions = {
  userId: string;
  storeId?: string;
  search?: string;
  after?: string;
  first?: number;
  ids?: string[];
};

const clampFirst = (value?: number) => {
  const fallback = 20;
  if (!value) return fallback;
  return Math.min(Math.max(value, 1), 50);
};

const sanitize = (value?: string | null) => value?.trim() ?? "";

const appendFilter = (query: string, filter: string) => {
  return query ? `${query} ${filter}` : filter;
};

const buildQueryString = (
  search?: string,
  storeId?: string,
  ids?: string[],
) => {
  let query = "";

  const term = sanitize(search);
  if (term) {
    query = appendFilter(query, `"${term}"`);
  }

  if (storeId) {
    query = appendFilter(query, `stores:"${storeId}"`);
  }

  if (ids && ids.length > 0) {
    query = appendFilter(query, `id:${ids.join(",")}`);
  }

  query = appendFilter(query, "order_by:id order_dir:desc");

  return query.trim();
};

type GraphQLProductsResponse = {
  products: ProductConnection & {
    edges: Array<{ cursor: string; node: LightfunnelsProduct }>;
  };
};

export async function fetchStoreProducts({
  userId,
  storeId,
  search,
  after,
  first,
  ids,
}: FetchProductsOptions): Promise<ProductConnection> {
  const { token } = await getUserLightfunnelsToken(userId);

  const queryString = buildQueryString(search, storeId, ids);

  const response = await lf<GraphQLProductsResponse>({
    token,
    data: {
      query: PRODUCTS_QUERY,
      variables: {
        query: queryString,
        after: after ?? undefined,
        first: clampFirst(first),
      },
    },
  });
  const connection = response.data.products;

  return {
    edges: connection.edges,
    pageInfo: {
      ...connection.pageInfo,
      hasPreviousPage: false,
      startCursor: null,
    },
  };
}
