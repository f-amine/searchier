import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import type { BetterAuthPlugin } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
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

const skipOAuthStateCookieCheck = (): BetterAuthPlugin => ({
  id: "skip-oauth-state-cookie-check",
  hooks: {
    before: [
      {
        matcher() {
          return true;
        },
        handler: createAuthMiddleware(async (ctx) => {
          if (ctx.path !== "/callback/:id") {
            return;
          }

          return {
            context: {
              context: {
                oauthConfig: {
                  skipStateCookieCheck: true,
                },
              },
            },
          };
        }),
      },
    ],
  },
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  usePlural: true,
  appName: "Lightfunnels",
  baseURL: defaultBaseURL,
  basePath: "/api/auth",
  trustedOrigins: [
    process.env.LF_FRONT_URL ?? "https://app.lightfunnels.com",
  ],
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
