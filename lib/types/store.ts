export type LightfunnelsStoreDomain = {
  id: string;
  name: string | null;
};

export type LightfunnelsStoreTemplate = {
  id: string;
  name?: string | null;
  desktop_thumbnail?: string | null;
  mobile_thumbnail?: string | null;
};

export type LightfunnelsStoreNode = {
  __typename: "Store";
  id: string;
  uid: string;
  name: string;
  defaultDomain: string | null;
  slug: string;
  published: boolean;
  currency: string;
  currency_format: string | null;
  primary_domain: LightfunnelsStoreDomain | null;
  channelTemplate?: {
    starting_step_id?: string | null;
    template?: LightfunnelsStoreTemplate | null;
    id: string;
  } | null;
  funnel?: {
    id: string;
    destinationTemplate?: {
      uid: string;
      id: string;
    } | null;
  } | null;
};

export type LightfunnelsStoreEdge = {
  cursor: string;
  node: LightfunnelsStoreNode;
};

export type LightfunnelsStoreConnection = {
  edges: LightfunnelsStoreEdge[];
  pageInfo: {
    endCursor: string | null;
    hasNextPage: boolean;
  };
};
