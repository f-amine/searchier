import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { fetchLightfunnelsAccount } from "@/lib/lightfunnels";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./drizzle";
import type { Account } from "better-auth";

const cookiePrefix = "searchier";
const defaultScopes = "orders,funnels,products";

const defaultBaseURL = process.env.BETTER_AUTH_URL;

const ensureEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not configured`);
  }
  return value;
};

const isProduction = process.env.NODE_ENV === "production";

type ExtendedAccount = Account & {
  lfAccountId?: string | null;
  lfAccessToken?: string | null;
};

const syncLfFields = (
  incoming: Partial<ExtendedAccount>,
): Record<string, string | null> => {
  const updates: Record<string, string | null> = {};

  if (incoming.accountId && incoming.accountId !== incoming.lfAccountId) {
    updates.lfAccountId = incoming.accountId;
  }

  if (incoming.accessToken && incoming.accessToken !== incoming.lfAccessToken) {
    updates.lfAccessToken = incoming.accessToken;
  }

  return updates;
};

const withLfFieldOverrides = <T extends Partial<ExtendedAccount>>(data: T) => {
  const overrides = syncLfFields(data);
  if (Object.keys(overrides).length === 0) {
    return null;
  }
  return { ...data, ...overrides };
};

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  account: {
    additionalFields: {
      lfAccountId: {
        type: "string",
        fieldName: "lf_account_id",
        required: false,
        input: false,
      },
      lfAccessToken: {
        type: "string",
        fieldName: "lf_access_token",
        required: false,
        input: false,
      },
    },
  },
  usePlural: true,
  appName: "Lightfunnels",
  baseURL: defaultBaseURL,
  basePath: "/api/auth",
  secret: ensureEnv("APP_SECRET"),
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}.session-token`,
      options: {
        path: "/",
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
      },
    },
    sessionData: {
      name: `${cookiePrefix}.session-data`,
      options: {
        path: "/",
        sameSite: "lax",
        secure: isProduction,
        httpOnly: true,
      },
    },
    dontRememberToken: {
      name: `${cookiePrefix}.dont-remember`,
      options: {
        path: "/",
        sameSite: "lax",
        secure: isProduction,
        httpOnly: true,
      },
    },
  },
  databaseHooks: {
    account: {
      create: {
        before: async (acc) => {
          const nextData = withLfFieldOverrides(acc as ExtendedAccount);
          if (nextData) {
            return { data: nextData };
          }
        },
      },
      update: {
        before: async (acc) => {
          const nextData = withLfFieldOverrides(
            acc as Partial<ExtendedAccount>,
          );
          if (nextData) {
            return { data: nextData };
          }
        },
      },
    },
  },
  plugins: [
    nextCookies(),
    genericOAuth({
      config: [
        {
          providerId: "lightfunnels",
          clientId: ensureEnv("LF_APP_CLIENT"),
          clientSecret: ensureEnv("LF_APP_SECRET"),
          authorizationUrl: `${ensureEnv("LF_FRONT_URL")}/admin/oauth`,
          tokenUrl: `${ensureEnv("LF_URL")}/oauth/access_token`,
          authorizationUrlParams: {
            scope: defaultScopes,
          },
          getUserInfo: async (tokens) => {
            if (!tokens.accessToken) {
              throw new Error("Missing Lightfunnels access token");
            }
            const account = await fetchLightfunnelsAccount(tokens.accessToken);

            return {
              id: account.id,
              email: account.email,
              name: account.account_name,
              image: account.image?.url,
              emailVerified: Boolean(account.email),
            };
          },
        },
      ],
    }),
  ],
});
