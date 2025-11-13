export type LightfunnelsProduct = {
  id: string;
  name: string;
  slug: string;
  thumbnail?: {
    path?: string | null;
  } | null;
};

export type ProductEdge = {
  cursor: string;
  node: LightfunnelsProduct;
};

export type ProductConnection = {
  edges: ProductEdge[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
    hasPreviousPage?: boolean;
    startCursor?: string | null;
  };
};
