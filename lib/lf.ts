type GraphQLResponse<Data> = {
  data: Data;
  errors?: Array<{ key?: string; message?: string; [key: string]: unknown }>;
};

type Opts = {
  data: {
    query: string;
    variables?: Record<string, unknown>;
  };
  token: string;
};

export class LfError extends Error {
  constructor(public errors: Array<{ key?: string; message?: string }>) {
    super("Lightfunnels request failed");
    this.name = "LfError";
  }
}

export default async function lf<Type = unknown>({
  token,
  data,
}: Opts): Promise<GraphQLResponse<Type>> {
  const baseUrl = process.env.LF_URL;
  if (!baseUrl) {
    throw new Error("LF_URL is not configured");
  }

  const response = await fetch(`${baseUrl}/api/v2`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const payload = (await response.json()) as GraphQLResponse<Type>;
  if (payload.errors?.length) {
    throw new LfError(payload.errors);
  }
  return payload;
}

type Address = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  country: string;
  city: string;
  area: string;
  zip: string;
  state: string;
};

type OrderCustomer = {
  id: string;
  full_name: string;
  avatar: string;
  location: string;
};

type OrderItemOption = {
  id: string;
  label: string;
  value: string;
};

type OrderItem = {
  __typename: "VariantSnapshot";
  product_id: string;
  id: string;
  _id: number;
  image: { path: string } | null;
  file?: { id: string; path?: string } | null;
  customer_files: Array<Record<string, unknown>>;
  title: string;
  price: number;
  variant_id: string;
  fulfillment_status: string;
  carrier: string;
  tracking_number: string | null;
  tracking_link: string | null;
  refund_id: string | null;
  payment_id: string | null;
  removed_at: string | null;
  sku: string;
  custom_options: Array<Record<string, unknown>>;
  options: OrderItemOption[];
};

type PaymentBundleSnapshot = {
  id: string;
  value: number;
  discount_result: number;
  label: string;
  offer_id: string | null;
};

type OrderRefund = {
  id: string;
  _id: number;
  amount: number;
  reason: string;
};

type OrderPayment = {
  id: string;
  _id: number;
  total: number;
  sub_total: number;
  created_at: string;
  refunded: number;
  refundable: number;
  price_bundle_snapshot: PaymentBundleSnapshot[];
  discount_snapshot: Record<string, unknown> | null;
  refunds: OrderRefund[];
  source: {
    payment_gateway: {
      prototype: {
        key: string;
      };
    };
  };
  cookies: Record<string, unknown>;
};

export type Order = {
  id: string;
  __typename: "Order";
  _id: number;
  total: number;
  account_id: string;
  subtotal: number;
  discount_value: number;
  normal_discount_value: number;
  bundle_discount_value: number;
  pm_discount_value: number;
  pm_extra_fees: number;
  name: string;
  notes: string;
  email: string;
  phone: string;
  archived_at: string | null;
  refunded_amount: number;
  paid_by_customer: number;
  net_payment: number;
  original_total: number;
  refundable: number;
  created_at: string;
  cancelled_at: string | null;
  test: boolean;
  tags: string[];
  shipping: number;
  shipping_discount: number;
  funnel_id: string;
  store_id: string | null;
  customer: OrderCustomer;
  custom: Record<string, unknown>;
  items: OrderItem[];
  payments: OrderPayment[];
  shipping_address: Address;
  billing_address: Address;
  client_details: {
    ip: string;
    [key: string]: unknown;
  };
  utm: Record<string, unknown> | null;
  currency: string;
  link?: string | null;
  thank_you_url?: string | null;
};

export type OrderWebhookPayload = {
  node: Order;
};

export async function img({ url, token }: { url: string; token: string }) {
  const result = await lf<{
    importImage: { id: string; path: string };
  }>({
    token,
    data: {
      query: `
        mutation importByUrlMutation($url: String!) {
          importImage(url: $url) {
            id
            path
          }
        }`,
      variables: {
        url,
      },
    },
  });

  return result.data.importImage.path;
}
const GET_STORE_SCRIPTS_QUERY = `
  query getStoreScripts($id: ID!) {
    node(id: $id) {
      ... on Store {
        header_scripts
      }
    }
  }
`;
export async function injectScriptIntoStore(
  token: string,
  storeId: string,
  scriptTag: string,
) {
  const scriptUrl = scriptTag.match(/src="([^"]+)"/)?.[1];
  if (!scriptUrl) {
    throw new Error("Invalid script tag provided.");
  }

  const response = await lf<{ node: { header_scripts: string | null } }>({
    token,
    data: {
      query: GET_STORE_SCRIPTS_QUERY,
      variables: { id: storeId },
    },
  });

  const currentScripts = response.data.node?.header_scripts || "";

  const escapedUrl = scriptUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const scriptPattern = new RegExp(
    `<script[^>]*\\ssrc=["']${escapedUrl}["'][^>]*>(?:</script>)?`,
    "gi",
  );

  const cleanedScripts = currentScripts
    .split("\n")
    .filter((line) => !scriptPattern.test(line))
    .join("\n")
    .trim();

  const newScripts = (cleanedScripts + "\n" + scriptTag).trim();

  if (newScripts === currentScripts.trim()) {
    return;
  }

  await lf({
    token,
    data: {
      query: UPDATE_STORE_SCRIPTS_MUTATION,
      variables: {
        id: storeId,
        node: {
          header_scripts: newScripts,
        },
      },
    },
  });
}
const UPDATE_STORE_SCRIPTS_MUTATION = `
  mutation updateStoreScripts($id: ID!, $node: StoreUpdateInput!) {
    updateStore(id: $id, node: $node) {
      id
      header_scripts
    }
  }
`;
export async function removeScriptFromStore(
  token: string,
  storeId: string,
  scriptUrl: string,
) {
  const response = await lf<{ node: { header_scripts: string | null } }>({
    token,
    data: { query: GET_STORE_SCRIPTS_QUERY, variables: { id: storeId } },
  });
  const currentScripts = response.data.node?.header_scripts || "";
  if (!currentScripts.trim()) return;
  const escapedUrl = scriptUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const scriptPattern = new RegExp(
    `<script[^>]*\\ssrc=["']${escapedUrl}["'][^>]*>(?:</script>)?`,
    "gi",
  );
  const cleanedScripts = currentScripts
    .split("\n")
    .filter((line) => !scriptPattern.test(line))
    .join("\n")
    .trim();
  if (cleanedScripts === currentScripts.trim()) return;
  await lf({
    token,
    data: {
      query: UPDATE_STORE_SCRIPTS_MUTATION,
      variables: { id: storeId, node: { header_scripts: cleanedScripts } },
    },
  });
}
