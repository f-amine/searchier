const LF_GRAPHQL_ENDPOINT = process.env.LF_URL
  ? `${process.env.LF_URL}/api/v2`
  : undefined;

const ACCOUNT_QUERY = `
  query app {
    account {
      id
      email
      account_name
      image {
        url
      }
    }
  }
`;

export type LightfunnelsAccount = {
  id: string;
  email: string;
  account_name: string;
  image?: {
    url?: string;
  } | null;
};

export async function fetchLightfunnelsAccount(
  accessToken: string,
): Promise<LightfunnelsAccount> {
  if (!accessToken) {
    throw new Error("Missing Lightfunnels access token");
  }

  if (!LF_GRAPHQL_ENDPOINT) {
    throw new Error("LF_URL is not configured");
  }

  const response = await fetch(LF_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `bearer ${accessToken}`,
    },
    body: JSON.stringify({
      query: ACCOUNT_QUERY,
    }),
    cache: "no-cache",
  });

  if (!response.ok) {
    const message = `Lightfunnels userinfo failed with ${response.status}`;
    throw new Error(message);
  }

  const payload = (await response.json()) as {
    data?: { account?: LightfunnelsAccount };
    errors?: Array<{ message?: string }>;
  };

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((err) => err.message).join(", "));
  }

  const account = payload.data?.account;

  if (!account?.id) {
    throw new Error("Lightfunnels account is missing an id");
  }

  if (!account.email) {
    throw new Error("Lightfunnels account is missing an email");
  }

  return account;
}
