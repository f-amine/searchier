import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import type { BetterAuthPlugin } from "better-auth";
import { fetchLightfunnelsAccount } from "@/lib/lightfunnels";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./drizzle";

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
const authBasePath = "/api/auth";

const skipOAuthStateCookieCheck = (): BetterAuthPlugin => ({
  id: "skip-oauth-state-cookie-check",
  init: () => ({
    context: {
      oauthConfig: {
        skipStateCookieCheck: true,
      },
    },
  }),
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  usePlural: true,
  appName: "Lightfunnels",
  baseURL: defaultBaseURL,
  basePath: authBasePath,
  trustedOrigins: [process.env.LF_FRONT_URL ?? "https://app.lightfunnels.com"],
  secret: ensureEnv("APP_SECRET"),
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      partitioned: true,
    },
    cookies: {
      oauth_state: {
        attributes: {
          sameSite: "none",
          secure: true,
        },
      },
    },
  },
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}.session-token`,
      options: {
        path: "/",
        sameSite: "none",
        secure: true,
        partitioned: true,
      },
    },
    sessionData: {
      name: `${cookiePrefix}.session-data`,
      options: {
        path: "/",
        sameSite: "none",
        secure: true,
        httpOnly: true,
        partitioned: true,
      },
    },
    dontRememberToken: {
      name: `${cookiePrefix}.dont-remember`,
      options: {
        path: "/",
        sameSite: "none",
        secure: true,
        httpOnly: true,
        partitioned: true,
      },
    },
  },
  plugins: [
    skipOAuthStateCookieCheck(),
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
