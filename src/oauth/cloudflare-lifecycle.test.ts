import { afterEach, describe, expect, it, vi } from "vitest";
import { createCatalogStore } from "../catalog-store.ts";
import { ConnectionService } from "../connection-service.ts";
import { provider as browser } from "../providers/cloudflare_browser_rendering/definition.ts";
import { provider as dns } from "../providers/cloudflare_dns/definition.ts";
import { provider as r2 } from "../providers/cloudflare_r2/definition.ts";
import { provider as worker } from "../providers/cloudflare_worker/definition.ts";
import { ProviderLoader } from "../providers/provider-loader.ts";
import { SqliteRuntimeDatabase } from "../server/storage/sqlite/runtime-store.ts";
import { OAuthClientConfigService } from "./oauth-client-config-service.ts";
import { OAuthCredentialRefreshService } from "./oauth-credential-refresh-service.ts";
import { OAuthFlowService } from "./oauth-flow-service.ts";

// Only the vendor HTTP/DNS boundary is simulated. Definitions, validators, token
// exchange/refresh, action executors and SQL persistence use production code.
vi.mock("node:dns/promises", () => ({ lookup: async () => [{ address: "104.16.132.229", family: 4 }] }));
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const cases = [
  {
    provider: worker,
    action: "list_worker_scripts",
    path: "/accounts/account-1/workers/scripts",
    result: [],
    output: "scripts",
    identityScope: "user-details.read",
  },
  {
    provider: r2,
    action: "list_buckets",
    path: "/accounts/account-1/r2/buckets",
    result: { buckets: [] },
    output: "buckets",
    identityScope: "user-details.read",
  },
  {
    provider: dns,
    action: "list_zones",
    path: "/zones",
    result: [],
    output: "zones",
    identityScope: "user-details.read",
  },
  {
    provider: browser,
    action: "list_accounts",
    path: "/memberships",
    result: [{ status: "accepted", account: { id: "account-1", name: "Test account" } }],
    output: "accounts",
    identityScope: "memberships.read",
  },
];

describe("Cloudflare reconnect and refresh lifecycle", () => {
  it.each(cases)(
    "$provider.service replaces an expired grant and persists two refresh rotations",
    async ({ provider, action, path, result, output, identityScope }) => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-10-12T00:00:00Z"));
      const db = new SqliteRuntimeDatabase(":memory:");
      try {
        const service = provider.service;
        const catalog = createCatalogStore([provider], { executableActionIds: provider.actions.map((a) => a.id) });
        const loader = new ProviderLoader({
          cloudflare_worker: () => import("../providers/cloudflare_worker/executors.ts"),
          cloudflare_r2: () => import("../providers/cloudflare_r2/executors.ts"),
          cloudflare_dns: () => import("../providers/cloudflare_dns/executors.ts"),
          cloudflare_browser_rendering: () => import("../providers/cloudflare_browser_rendering/executors.ts"),
        });
        const configs = new OAuthClientConfigService({
          catalog,
          origin: "https://connector.example",
          store: db.oauthClientConfigStore,
        });
        await configs.upsertConfig({
          service,
          clientId: "client",
          clientSecret: "secret",
          requestedScopes: [identityScope],
        });
        await configs.resetRequestedScopes(service);
        const createConnections = () =>
          new ConnectionService({
            catalog,
            providerLoader: loader,
            store: db.connectionStore,
            oauthCredentials: new OAuthCredentialRefreshService(configs, loader),
          });
        const connections = createConnections();
        const old = await db.connectionStore.set(service, "team", {
          authType: "oauth2",
          accessToken: "expired",
          tokenType: "Bearer",
          expiresAt: "2026-10-11T00:00:00Z",
          profile: { accountId: "old-user", displayName: "Old connection", grantedScopes: [] },
          metadata: {},
        });
        await expect(connections.getCredential(service, "team")).rejects.toMatchObject({ code: "oauth_token_expired" });
        const flow = new OAuthFlowService({
          clientConfigs: configs,
          connections,
          providerLoader: loader,
          states: db.oauthStateStore,
          requests: db.connectionRequestStore,
        });
        const started = await flow.startConnectionRequest({
          service,
          connectionName: "team",
          target: old,
          owner: "test-owner",
        });
        const scopes = new URL(started.authorizationUrl).searchParams.get("scope")!.split(" ");
        expect(scopes).toContain("offline_access");
        expect(scopes).toContain(identityScope);
        expect(scopes).not.toContain("user-details.write");
        let generation = 0;
        let failRefresh = false;
        let actionCalls = 0;
        const transport = vi.fn<typeof fetch>(async (url, init) => {
          const endpoint = new URL(String(url));
          const headers = new Headers(init?.headers);
          if (endpoint.pathname === "/oauth2/token") {
            expect(endpoint.origin).toBe("https://dash.cloudflare.com");
            expect(headers.get("authorization")).toBe(`Basic ${Buffer.from("client:secret").toString("base64")}`);
            const body = new URLSearchParams(String(init?.body));
            if (body.get("grant_type") === "authorization_code") {
              expect(body.get("redirect_uri")).toBe("https://connector.example/oauth/callback");
              expect(body.get("code")).toBe("consent-code");
            } else {
              expect(body.get("grant_type")).toBe("refresh_token");
              expect(body.get("refresh_token")).toBe(`refresh-${generation}`);
              if (failRefresh) return Response.json({ error: "invalid_grant" }, { status: 400 });
              generation++;
            }
            return Response.json({
              access_token: `access-${generation}`,
              refresh_token: `refresh-${generation}`,
              token_type: "Bearer",
              expires_in: 3600,
              scope: scopes.join(" "),
            });
          }
          expect(endpoint.origin).toBe("https://api.cloudflare.com");
          expect(headers.get("authorization")).toBe(`Bearer access-${generation}`);
          if (endpoint.pathname === "/client/v4/user")
            return Response.json({ success: true, result: { id: "user-1", email: "test@example.com" } });
          expect(endpoint.pathname).toBe(`/client/v4${path}`);
          actionCalls++;
          return Response.json({
            success: true,
            result,
            result_info: { page: 1, per_page: 50, count: 1, total_count: 1 },
          });
        });
        vi.stubGlobal("fetch", transport);
        await flow.completeAuthorization({ state: started.stateHandle, code: "consent-code" });
        const saved = await db.connectionStore.get(service, "team");
        if (saved?.credential?.authType !== "oauth2") throw new Error("Expected saved OAuth credential");
        expect(saved.id).toBe(old.id);
        expect(saved?.credential).toMatchObject({ accessToken: "access-0", refreshToken: "refresh-0" });
        const executor = (await loader.loadActionExecutor(service, `${service}.${action}`))!;
        for (let cycle = 1; cycle <= 2; cycle++) {
          vi.setSystemTime(Date.now() + 3601_000);
          // A fresh service instance proves the next rotation uses the SQL-stored token.
          const restarted = createConnections();
          const outputs = await Promise.all([
            executor({ accountId: "account-1" }, restarted.forConnection("team")),
            executor({ accountId: "account-1" }, restarted.forConnection("team")),
          ]);
          for (const response of outputs)
            expect(response).toMatchObject({ ok: true, output: { [output]: expect.any(Array) } });
          expect(generation).toBe(cycle);
          const rotated = await db.connectionStore.get(service, "team");
          if (rotated?.credential?.authType !== "oauth2") throw new Error("Expected persisted OAuth rotation");
          expect(rotated.id).toBe(old.id);
          expect(rotated?.credential).toMatchObject({
            accessToken: `access-${cycle}`,
            refreshToken: `refresh-${cycle}`,
            profile: saved.credential.profile,
          });
          expect(rotated.credential.metadata.oauthAuthorizationId).toBe(started.stateHandle);
        }
        const beforeFailure = await db.connectionStore.get(service, "team");
        vi.setSystemTime(Date.now() + 3601_000);
        failRefresh = true;
        const callsBeforeFailure = actionCalls;
        await expect(createConnections().getCredential(service, "team")).rejects.toMatchObject({
          code: "oauth_token_refresh_failed",
        });
        expect(await db.connectionStore.get(service, "team")).toEqual(beforeFailure);
        expect(actionCalls).toBe(callsBeforeFailure);
      } finally {
        db.close();
      }
    },
  );
});
