import type { ExecutionContext, ResolvedCredential } from "../../core/types.ts";

import { afterEach, describe, expect, it, vi } from "vitest";
import { setDefaultGuardedFetchDnsLookup } from "../../core/guarded-fetch.ts";
import { credentialValidators, executors, proxy } from "./executors.ts";

function oauthCredential(metadata: Record<string, unknown>): Extract<ResolvedCredential, { authType: "oauth2" }> {
  return {
    authType: "oauth2",
    accessToken: "oauth-access-token",
    tokenType: "Bearer",
    profile: {
      accountId: "cloudflare:test",
      displayName: "Cloudflare Browser Run",
      grantedScopes: ["memberships.read", "browser-rendering.read", "browser-rendering.write"],
    },
    metadata,
  };
}

function executionContext(credential: ResolvedCredential): ExecutionContext {
  return { getCredential: async () => credential };
}

function apiKeyCredential(): Extract<ResolvedCredential, { authType: "api_key" }> {
  return {
    authType: "api_key",
    apiKey: "api-key-token",
    values: { accountId: "account-1" },
    profile: {
      accountId: "account-1",
      displayName: "Cloudflare Browser Run",
      grantedScopes: [],
    },
    metadata: { accountId: "account-1" },
  };
}
afterEach(() => {
  setDefaultGuardedFetchDnsLookup(null);
  vi.unstubAllGlobals();
});

describe("Cloudflare Browser Run OAuth", () => {
  it("validates OAuth by resolving the one accessible Cloudflare account", async () => {
    const fetch = vi.fn(async () =>
      Response.json({
        success: true,
        result: [
          {
            id: "membership-1",
            account: { id: "account-1", name: "Amplift", type: "standard" },
            status: "accepted",
          },
        ],
        result_info: { page: 1, per_page: 50, count: 1, total_count: 1, total_pages: 1 },
      }),
    );

    const result = await credentialValidators.oauth2!(oauthCredential({}), { fetcher: fetch });

    expect(fetch).toHaveBeenCalledWith(
      "https://api.cloudflare.com/client/v4/memberships?page=1&per_page=50&status=accepted",
      expect.objectContaining({ headers: expect.objectContaining({ authorization: "Bearer oauth-access-token" }) }),
    );
    expect(result).toMatchObject({
      profile: { accountId: "account-1", displayName: "Amplift" },
      metadata: { accountId: "account-1", accountName: "Amplift", accountType: "standard" },
    });
  });

  it("lists OAuth accounts through Cloudflare memberships", async () => {
    const fetch = vi.fn(async () =>
      Response.json({
        success: true,
        result: [
          {
            id: "membership-1",
            account: { id: "account-1", name: "Amplift", type: "standard" },
            status: "accepted",
          },
        ],
        result_info: { page: 1, per_page: 50, count: 1, total_count: 1 },
      }),
    );
    vi.stubGlobal("fetch", fetch);
    setDefaultGuardedFetchDnsLookup(null);

    const result = await executors["cloudflare_browser_rendering.list_accounts"]!(
      {},
      executionContext(oauthCredential({ accountId: "account-1" })),
    );

    expect(result).toEqual({
      ok: true,
      output: {
        accounts: [{ id: "account-1", name: "Amplift", type: "standard" }],
        resultInfo: { page: 1, perPage: 50, count: 1, totalCount: 1 },
      },
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.cloudflare.com/client/v4/memberships?page=1&per_page=50&status=accepted",
      expect.objectContaining({ headers: expect.objectContaining({ authorization: "Bearer oauth-access-token" }) }),
    );
  });

  it("executes Browser Run with the OAuth bearer token and resolved account", async () => {
    const fetch = vi.fn(async () => Response.json({ success: true, result: "# OpenMeld" }));
    vi.stubGlobal("fetch", fetch);
    setDefaultGuardedFetchDnsLookup(null);

    const result = await executors["cloudflare_browser_rendering.get_markdown"]!(
      { url: "https://openmeld.ai" },
      executionContext(oauthCredential({ accountId: "account-1" })),
    );

    expect(result).toEqual({ ok: true, output: { markdown: "# OpenMeld" } });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.cloudflare.com/client/v4/accounts/account-1/browser-rendering/markdown",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ authorization: "Bearer oauth-access-token" }),
      }),
    );
  });

  it("uses OAuth for raw proxy requests", async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      Response.json({ success: true, result: [] }),
    );
    vi.stubGlobal("fetch", fetch);
    setDefaultGuardedFetchDnsLookup(null);

    const result = await proxy(
      { method: "GET", endpoint: "/accounts" },
      executionContext(oauthCredential({ accountId: "account-1" })),
    );

    expect(result).toMatchObject({ ok: true });
    expect(fetch.mock.calls[0]?.[0]).toBe("https://api.cloudflare.com/client/v4/accounts");
    expect(new Headers(fetch.mock.calls[0]?.[1]?.headers).get("authorization")).toBe("Bearer oauth-access-token");
  });

  it("keeps API token actions working", async () => {
    const fetch = vi.fn(async () => Response.json({ success: true, result: "# OpenMeld" }));
    vi.stubGlobal("fetch", fetch);
    setDefaultGuardedFetchDnsLookup(null);

    const result = await executors["cloudflare_browser_rendering.get_markdown"]!(
      { url: "https://openmeld.ai" },
      executionContext(apiKeyCredential()),
    );

    expect(result).toEqual({ ok: true, output: { markdown: "# OpenMeld" } });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.cloudflare.com/client/v4/accounts/account-1/browser-rendering/markdown",
      expect.objectContaining({ headers: expect.objectContaining({ authorization: "Bearer api-key-token" }) }),
    );
  });

  it("recovers a newly refreshed OAuth token rejected before rendering", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ success: false, errors: [{ code: 10000, message: "Authentication error" }] }, { status: 403 }),
      )
      .mockResolvedValueOnce(Response.json({ success: true, result: "# OpenMeld" }));
    vi.stubGlobal("fetch", fetch);
    const logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
    const credential = oauthCredential({ accountId: "account-1", refreshedAt: new Date().toISOString() });
    const result = await executors["cloudflare_browser_rendering.get_markdown"]!(
      { url: "https://openmeld.ai" },
      { ...executionContext(credential), logger },
    );
    expect(result).toEqual({ ok: true, output: { markdown: "# OpenMeld" } });
    expect(fetch).toHaveBeenCalledTimes(2);
    for (const [, init] of fetch.mock.calls) expect(init.headers.authorization).toBe("Bearer oauth-access-token");
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ service: "cloudflare_browser_rendering", attempt: 1 }),
      "cloudflare.browser_run.fresh_token_auth_retry",
    );
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain("oauth-access-token");
  });

  it.each([
    [oauthCredential({ accountId: "account-1" }), 403, "Authentication error"],
    [
      oauthCredential({ accountId: "account-1", refreshedAt: new Date(Date.now() - 180_000).toISOString() }),
      403,
      "Authentication error",
    ],
    [oauthCredential({ accountId: "account-1", refreshedAt: "invalid" }), 403, "Authentication error"],
    [apiKeyCredential(), 403, "Authentication error"],
    [oauthCredential({ accountId: "account-1", refreshedAt: new Date().toISOString() }), 403, "Permission denied"],
    [oauthCredential({ accountId: "account-1", refreshedAt: new Date().toISOString() }), 429, "Rate limit exceeded"],
  ])("does not replay an unrelated or established credential failure (%#)", async (credential, status, message) => {
    const fetch = vi.fn(async () => Response.json({ success: false, errors: [{ message }] }, { status }));
    vi.stubGlobal("fetch", fetch);
    const result = await executors["cloudflare_browser_rendering.get_markdown"]!(
      { url: "https://openmeld.ai" },
      executionContext(credential),
    );
    expect(result).toMatchObject({ ok: false, error: { message } });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("keeps the original authentication failure after bounded attempts", async () => {
    const envelope = { success: false, errors: [{ code: 10000, message: "Authentication error" }] };
    const fetch = vi.fn(async () => Response.json(envelope, { status: 403 }));
    vi.stubGlobal("fetch", fetch);
    const result = await executors["cloudflare_browser_rendering.get_markdown"]!(
      { url: "https://openmeld.ai" },
      executionContext(oauthCredential({ accountId: "account-1", refreshedAt: new Date().toISOString() })),
    );
    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "authorization_failed",
        message: "Authentication error",
        details: { status: 403, details: envelope },
      },
    });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("does not send another rendering request after cancellation", async () => {
    const controller = new AbortController();
    const fetch = vi.fn(async () => {
      controller.abort();
      return Response.json({ success: false, errors: [{ message: "Authentication error" }] }, { status: 403 });
    });
    vi.stubGlobal("fetch", fetch);
    const result = await executors["cloudflare_browser_rendering.get_markdown"]!(
      { url: "https://openmeld.ai" },
      {
        ...executionContext(oauthCredential({ accountId: "account-1", refreshedAt: new Date().toISOString() })),
        signal: controller.signal,
      },
    );
    expect(result.ok).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("requires an explicit accessible account when OAuth can reach more than one", async () => {
    const fetch = vi.fn(async () => Response.json({ success: true, result: "# OpenMeld" }));
    vi.stubGlobal("fetch", fetch);
    setDefaultGuardedFetchDnsLookup(null);
    const credential = oauthCredential({
      availableAccounts: [
        { id: "account-1", name: "Amplift" },
        { id: "account-2", name: "Personal" },
      ],
    });

    const missingAccount = await executors["cloudflare_browser_rendering.get_markdown"]!(
      { url: "https://openmeld.ai" },
      executionContext(credential),
    );
    const selectedAccount = await executors["cloudflare_browser_rendering.get_markdown"]!(
      { accountId: "account-1", url: "https://openmeld.ai" },
      executionContext(credential),
    );

    expect(missingAccount).toMatchObject({
      ok: false,
      error: { message: expect.stringContaining("accountId is required") },
    });
    expect(selectedAccount).toEqual({ ok: true, output: { markdown: "# OpenMeld" } });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("directs OAuth callers to list_accounts when no Cloudflare account is selected", async () => {
    const result = await executors["cloudflare_browser_rendering.get_markdown"]!(
      { url: "https://openmeld.ai" },
      executionContext(oauthCredential({})),
    );

    expect(result).toMatchObject({
      ok: false,
      error: {
        message:
          "accountId is required for this Cloudflare Browser Run action. Use list_accounts to find an accessible Cloudflare account ID.",
      },
    });
  });
});

describe("Cloudflare Browser Run API token validation", () => {
  it.each([
    ["cfut_user", "/user/tokens/verify"],
    ["legacy-user-token", "/user/tokens/verify"],
    ["cfat_account", "/accounts/account-1/tokens/verify"],
  ])("validates %s against its token owner", async (apiKey, endpoint) => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ success: true, result: { id: "token-id", status: "active" } }));
    await credentialValidators.apiKey!({ apiKey, values: { accountId: "account-1" } }, { fetcher });
    expect(fetcher.mock.calls[0]?.[0]).toBe(`https://api.cloudflare.com/client/v4${endpoint}`);
  });
  it("tries the account endpoint for an ambiguous legacy token only after unauthorized", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ success: false, errors: [{ message: "Invalid token" }] }, { status: 401 }))
      .mockResolvedValueOnce(Response.json({ success: true, result: { id: "token-id", status: "active" } }));
    await credentialValidators.apiKey!(
      { apiKey: "legacy-account-token", values: { accountId: "account-1" } },
      { fetcher },
    );
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      "https://api.cloudflare.com/client/v4/user/tokens/verify",
      "https://api.cloudflare.com/client/v4/accounts/account-1/tokens/verify",
    ]);
  });
  it("does not retry a service failure against another token endpoint", async () => {
    const fetcher = vi.fn(async () => Response.json({ success: false }, { status: 503 }));
    await expect(
      credentialValidators.apiKey!({ apiKey: "legacy-token", values: { accountId: "account-1" } }, { fetcher }),
    ).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
