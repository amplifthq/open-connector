import { describe, expect, it, vi } from "vitest";
import { validateActionInput } from "../../core/validation.ts";
import { ProviderRequestError } from "../provider-runtime.ts";
import { zerotierActions } from "./actions.ts";
import { credentialValidators, zerotierActionHandlers } from "./executors.ts";
import { createZerotierContext, zerotierV1BaseUrl, zerotierV2BaseUrl } from "./runtime.ts";

const jsonFetcher = (payload: unknown, assert?: (url: string, init?: RequestInit) => void): typeof fetch =>
  vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    assert?.(input.toString(), init);
    return Response.json(payload);
  }) as unknown as typeof fetch;

const v1Context = (fetcher: typeof fetch, values: Record<string, string> = {}) =>
  createZerotierContext({ apiVersion: "v1", apiKey: "v1-key", ...values }, fetcher);

const v2Context = (fetcher: typeof fetch, values: Record<string, string> = {}) =>
  createZerotierContext({ apiVersion: "v2", apiKey: "v2-key", orgId: "org-default", ...values }, fetcher);

describe("ZeroTier auth headers", () => {
  it("uses 'token <key>' for v1 connections", async () => {
    const fetcher = jsonFetcher([], (url, init) => {
      expect(url).toBe(`${zerotierV1BaseUrl}/network`);
      expect(new Headers(init?.headers).get("authorization")).toBe("token v1-key");
    });
    await zerotierActionHandlers.list_networks({}, v1Context(fetcher));
  });

  it("uses 'Bearer <key>' for v2 connections", async () => {
    const fetcher = jsonFetcher([], (url, init) => {
      expect(url).toContain(`${zerotierV2BaseUrl}/network`);
      expect(new Headers(init?.headers).get("authorization")).toBe("Bearer v2-key");
    });
    await zerotierActionHandlers.list_networks({}, v2Context(fetcher));
  });
});

describe("ZeroTier v1 request shaping", () => {
  it("registers the caller-supplied token value for a user", async () => {
    const token = "wwrb66uUh18Fqc38rd8jMd5RFJzRsCn4";
    const fetcher = jsonFetcher({ tokenName: "ci" }, (url, init) => {
      expect(url).toBe(`${zerotierV1BaseUrl}/user/u1/token`);
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toEqual({ tokenName: "ci", token });
    });
    const result = await zerotierActionHandlers.add_user_token(
      { userId: "u1", tokenName: "ci", token },
      v1Context(fetcher),
    );
    expect(result).toEqual({ result: { tokenName: "ci" } });
  });

  it("creates a network with its config name and description", async () => {
    const fetcher = jsonFetcher({ id: "nw1" }, (url, init) => {
      expect(url).toBe(`${zerotierV1BaseUrl}/network`);
      expect(JSON.parse(String(init?.body))).toEqual({
        config: { name: "lab", private: true },
        description: "Lab network",
      });
    });
    await zerotierActionHandlers.create_network(
      { name: "lab", description: "Lab network", config: { private: true } },
      v1Context(fetcher),
    );
  });

  it("sends the full permission set for a network user, with omitted flags as false", async () => {
    const fetcher = jsonFetcher({ id: "u1", r: true, a: false, m: false, d: false }, (url, init) => {
      expect(url).toBe(`${zerotierV1BaseUrl}/network/abc/users`);
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toEqual({ id: "u1", r: true, a: false, m: false, d: false });
    });
    const result = await zerotierActionHandlers.set_network_user_permissions(
      { networkId: "abc", userId: "u1", read: true },
      v1Context(fetcher),
    );
    expect(result).toEqual({ result: { id: "u1", r: true, a: false, m: false, d: false } });
  });

  it("nests v1 member fields under config", async () => {
    const fetcher = jsonFetcher({ id: "abcdef0123" }, (url, init) => {
      expect(url).toBe(`${zerotierV1BaseUrl}/network/nw1/member/abcdef0123`);
      expect(JSON.parse(String(init?.body))).toEqual({
        name: "laptop",
        config: { authorized: false, ipAssignments: ["10.0.0.1"] },
      });
    });
    await zerotierActionHandlers.update_member(
      { networkId: "nw1", memberId: "abcdef0123", name: "laptop", authorized: false, ipAssignments: ["10.0.0.1"] },
      v1Context(fetcher),
    );
  });

  it("sends empty user profile fields so they can be cleared", async () => {
    const fetcher = jsonFetcher({ id: "u1" }, (url, init) => {
      expect(url).toBe(`${zerotierV1BaseUrl}/user/u1`);
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toEqual({ displayName: "", smsNumber: "" });
    });
    await zerotierActionHandlers.update_user({ userId: "u1", displayName: "", smsNumber: "" }, v1Context(fetcher));
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("reads the current user's org on v1 without using the v2-only connection orgId", async () => {
    const fetcher = jsonFetcher({ id: "org-mine" }, (url) => {
      expect(url).toBe(`${zerotierV1BaseUrl}/org`);
    });
    const result = await zerotierActionHandlers.get_org({}, v1Context(fetcher, { orgId: "org-x" }));
    expect(result).toEqual({ result: { id: "org-mine" } });
    expect(fetcher).toHaveBeenCalledOnce();

    const explicit = jsonFetcher({ id: "org-y" }, (url) => {
      expect(url).toBe(`${zerotierV1BaseUrl}/org/org-y`);
    });
    await zerotierActionHandlers.get_org({ orgId: "org-y" }, v1Context(explicit, { orgId: "org-x" }));
    expect(explicit).toHaveBeenCalledOnce();
  });

  it.each([{ ipv4Assignments: ["10.0.0.1"] }, { ipv6Assignments: ["fd00::1"] }])(
    "rejects the v2-only member field %j on v1 before any request",
    async (fields) => {
      const fetcher = jsonFetcher({});
      const error = await zerotierActionHandlers
        .update_member({ networkId: "nw1", memberId: "abcdef0123", ...fields }, v1Context(fetcher))
        .catch((err: unknown) => err);
      expect(error).toBeInstanceOf(ProviderRequestError);
      expect((error as ProviderRequestError).status).toBe(400);
      expect(fetcher).not.toHaveBeenCalled();
    },
  );

  it.each([{ orgId: "org-x" }, { stats: true }, { stats: false }, { permissionCheck: ["read"] }])(
    "rejects the v2-only list_networks filter %j on v1 before any request",
    async (filters) => {
      const fetcher = jsonFetcher([]);
      const error = await zerotierActionHandlers
        .list_networks(filters, v1Context(fetcher))
        .catch((err: unknown) => err);
      expect(error).toBeInstanceOf(ProviderRequestError);
      expect((error as ProviderRequestError).status).toBe(400);
      expect(fetcher).not.toHaveBeenCalled();
    },
  );

  it("lists every v1 network without applying the v2-only connection orgId", async () => {
    const fetcher = jsonFetcher([{ id: "nw1" }], (url) => {
      expect(url).toBe(`${zerotierV1BaseUrl}/network`);
    });
    const result = await zerotierActionHandlers.list_networks({}, v1Context(fetcher, { orgId: "org-x" }));
    expect(result).toEqual({ items: [{ id: "nw1" }] });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("rejects the v2-only networkGroupId when creating a v1 network", async () => {
    const fetcher = jsonFetcher({ id: "nw1" });
    const error = await zerotierActionHandlers
      .create_network({ networkGroupId: "grp-x", name: "lab" }, v1Context(fetcher))
      .catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ProviderRequestError);
    expect((error as ProviderRequestError).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects network user permissions on v2 connections", async () => {
    const fetcher = jsonFetcher({});
    const error = await zerotierActionHandlers
      .set_network_user_permissions({ networkId: "abc", userId: "u1", read: true }, v2Context(fetcher))
      .catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ProviderRequestError);
    expect((error as ProviderRequestError).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("ZeroTier v2 request shaping", () => {
  it("falls back to the connection orgId for list_networks", async () => {
    const fetcher = jsonFetcher([], (url) => {
      expect(url).toBe(`${zerotierV2BaseUrl}/network?org-id=org-default`);
    });
    const result = await zerotierActionHandlers.list_networks({}, v2Context(fetcher));
    expect(result).toEqual({ items: [] });
  });

  it("prefers an explicit orgId over the connection default", async () => {
    const fetcher = jsonFetcher({ items: [] }, (url) => {
      expect(url).toBe(`${zerotierV2BaseUrl}/network?org-id=org-explicit&stats=true`);
    });
    await zerotierActionHandlers.list_networks({ orgId: "org-explicit", stats: true }, v2Context(fetcher));
  });

  it("falls back to the connection orgId for get_org", async () => {
    const fetcher = jsonFetcher({ id: "org-default" }, (url) => {
      expect(url).toBe(`${zerotierV2BaseUrl}/org/org-default`);
    });
    await zerotierActionHandlers.get_org({}, v2Context(fetcher));
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("rejects get_org on v2 when neither the input nor the connection names an org", async () => {
    const fetcher = jsonFetcher({});
    const error = await zerotierActionHandlers
      .get_org({}, v2Context(fetcher, { orgId: "" }))
      .catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ProviderRequestError);
    expect((error as ProviderRequestError).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("routes bulk member updates to the member endpoints", async () => {
    const members = [{ deviceId: "abcdef0123" }, { deviceId: "0123456789" }];
    const fetcher = jsonFetcher(members, (url, init) => {
      expect(url).toBe(`${zerotierV2BaseUrl}/network/nw1/member`);
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toEqual(members);
    });
    const result = await zerotierActionHandlers.add_members({ networkId: "nw1", members }, v2Context(fetcher));
    expect(result).toEqual({ items: members });
  });

  it("reports bulk member mutations as a status envelope", async () => {
    const fetcher = jsonFetcher({ message: "ok" }, (url, init) => {
      expect(url).toBe(`${zerotierV2BaseUrl}/network/nw1/member/authorize`);
      expect(JSON.parse(String(init?.body))).toEqual(["abcdef0123", "0123456789"]);
    });
    const result = await zerotierActionHandlers.authorize_members(
      { networkId: "nw1", deviceIds: ["abcdef0123", "0123456789"] },
      v2Context(fetcher),
    );
    expect(result).toEqual({ ok: true, result: { message: "ok" } });
  });

  it("keeps aggregate stats next to list items", async () => {
    const fetcher = jsonFetcher({ items: [{ id: "org1", name: "Acme" }], stats: { totalOrgs: 1 } }, (url) => {
      expect(url).toBe(`${zerotierV2BaseUrl}/org?stats=true`);
    });
    const result = await zerotierActionHandlers.list_orgs({ stats: true }, v2Context(fetcher));
    expect(result).toEqual({ items: [{ id: "org1", name: "Acme" }], stats: { totalOrgs: 1 } });
  });

  it("requires a name when creating a v2 network", async () => {
    const fetcher = jsonFetcher({});
    const error = await zerotierActionHandlers
      .create_network({ networkGroupId: "grp1" }, v2Context(fetcher))
      .catch((err: unknown) => err);
    expect((error as ProviderRequestError).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("sends an empty description so it can be cleared", async () => {
    const fetcher = jsonFetcher({}, (url, init) => {
      expect(url).toBe(`${zerotierV2BaseUrl}/network/nw1`);
      expect(JSON.parse(String(init?.body))).toEqual({ description: "" });
    });
    await zerotierActionHandlers.update_network({ networkId: "nw1", description: "" }, v2Context(fetcher));
  });

  it("sends an empty member name so it can be cleared", async () => {
    const v1Fetcher = jsonFetcher({ id: "abcdef0123" }, (url, init) => {
      expect(url).toBe(`${zerotierV1BaseUrl}/network/nw1/member/abcdef0123`);
      expect(JSON.parse(String(init?.body))).toEqual({ name: "", config: {} });
    });
    await zerotierActionHandlers.update_member(
      { networkId: "nw1", memberId: "abcdef0123", name: "" },
      v1Context(v1Fetcher),
    );
    expect(v1Fetcher).toHaveBeenCalledOnce();

    const v2Fetcher = jsonFetcher({ deviceId: "abcdef0123" }, (url, init) => {
      expect(url).toBe(`${zerotierV2BaseUrl}/network/nw1/member/abcdef0123`);
      expect(JSON.parse(String(init?.body))).toEqual({ name: "" });
    });
    await zerotierActionHandlers.update_member(
      { networkId: "nw1", memberId: "abcdef0123", name: "" },
      v2Context(v2Fetcher),
    );
    expect(v2Fetcher).toHaveBeenCalledOnce();
  });

  it("sends an empty v2 network name the way v1 does and leaves its validation to upstream", async () => {
    const fetcher = jsonFetcher({}, (url, init) => {
      expect(url).toBe(`${zerotierV2BaseUrl}/network/nw1`);
      expect(JSON.parse(String(init?.body))).toEqual({ name: "" });
    });
    await zerotierActionHandlers.update_network({ networkId: "nw1", name: "" }, v2Context(fetcher));
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("forwards group, service account, and user names exactly as given", async () => {
    const expectBody = (path: string, body: unknown) =>
      jsonFetcher({}, (url, init) => {
        expect(url).toBe(`${zerotierV2BaseUrl}${path}`);
        expect(init?.method).toBe("POST");
        expect(JSON.parse(String(init?.body))).toEqual(body);
      });

    const groupFetcher = expectBody("/network-group/grp1", { name: " " });
    await zerotierActionHandlers.update_network_group({ networkGroupId: "grp1", name: " " }, v2Context(groupFetcher));
    const accountFetcher = expectBody("/service-account/sa1", { name: "" });
    await zerotierActionHandlers.update_service_account(
      { serviceAccountId: "sa1", name: "" },
      v2Context(accountFetcher),
    );
    const userFetcher = expectBody("/user", { firstName: "", lastName: "" });
    await zerotierActionHandlers.update_current_user({ firstName: "", lastName: "" }, v2Context(userFetcher));

    expect(groupFetcher).toHaveBeenCalledOnce();
    expect(accountFetcher).toHaveBeenCalledOnce();
    expect(userFetcher).toHaveBeenCalledOnce();
  });

  it("sends flow rules to the v2beta base URL", async () => {
    const fetcher = jsonFetcher({ rules: [] }, (url) => {
      expect(url).toBe("https://central.zerotier.com/api/v2beta/network/nw1/flow-rule");
    });
    await zerotierActionHandlers.get_flow_rules({ networkId: "nw1" }, v2Context(fetcher));
  });

  it("sends only the UpdateMemberRequest fields for a v2 member update", async () => {
    const fetcher = jsonFetcher({ deviceId: "abcdef0123" }, (url, init) => {
      expect(url).toBe(`${zerotierV2BaseUrl}/network/nw1/member/abcdef0123`);
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toEqual({
        name: "laptop",
        description: "",
        activeBridge: false,
        noAutoAssignIps: true,
        ipv4Assignments: ["10.0.0.5"],
        ipv6Assignments: ["fd00::5"],
      });
    });
    await zerotierActionHandlers.update_member(
      {
        networkId: "nw1",
        memberId: "abcdef0123",
        name: "laptop",
        description: "",
        activeBridge: false,
        noAutoAssignIps: true,
        ipv4Assignments: ["10.0.0.5"],
        ipv6Assignments: ["fd00::5"],
      },
      v2Context(fetcher),
    );
  });

  it.each([{ authorized: false }, { authorized: true }, { ipAssignments: ["10.0.0.1"] }])(
    "rejects the v1-only member field %j on v2 before any request",
    async (fields) => {
      const fetcher = jsonFetcher({});
      const error = await zerotierActionHandlers
        .update_member({ networkId: "nw1", memberId: "abcdef0123", ...fields }, v2Context(fetcher))
        .catch((err: unknown) => err);
      expect(error).toBeInstanceOf(ProviderRequestError);
      expect((error as ProviderRequestError).status).toBe(400);
      expect(fetcher).not.toHaveBeenCalled();
    },
  );

  it("maps IAM actions to the resource iam endpoint", async () => {
    const tuples = [{ principal: "alice@example.com", principalType: "user", roles: ["NetworkGroupAdmin"] }];
    const fetcher = jsonFetcher(tuples, (url) => {
      expect(url).toBe(`${zerotierV2BaseUrl}/network-group/grp1/iam`);
    });
    const result = await zerotierActionHandlers.get_iam(
      { resourceType: "network-group", resourceId: "grp1" },
      v2Context(fetcher),
    );
    expect(result).toEqual({ items: tuples });
  });
});

describe("ZeroTier version guards", () => {
  it("rejects v2-only actions on v1 connections", async () => {
    const fetcher = jsonFetcher([]);
    const error = await zerotierActionHandlers.list_orgs({}, v1Context(fetcher)).catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ProviderRequestError);
    expect((error as ProviderRequestError).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects v1-only actions on v2 connections", async () => {
    const fetcher = jsonFetcher({});
    const error = await zerotierActionHandlers.get_status({}, v2Context(fetcher)).catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ProviderRequestError);
    expect((error as ProviderRequestError).status).toBe(400);
  });

  it("rejects an invalid apiVersion before any request", () => {
    expect(() => createZerotierContext({ apiVersion: "v3", apiKey: "key" }, jsonFetcher({}))).toThrow(
      ProviderRequestError,
    );
  });
});

describe("ZeroTier path IDs", () => {
  const expectRejected = async (run: (fetcher: typeof fetch) => Promise<unknown>) => {
    const fetcher = jsonFetcher({});
    const error = await run(fetcher).catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ProviderRequestError);
    expect((error as ProviderRequestError).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  };

  it.each(["..", " .. ", ".", "a/b", "a\\b"])(
    "rejects %j as a member, token, or network ID before any request",
    async (value) => {
      await expectRejected((fetcher) =>
        zerotierActionHandlers.delete_member({ networkId: "8056c2e21c000001", memberId: value }, v1Context(fetcher)),
      );
      await expectRejected((fetcher) =>
        zerotierActionHandlers.delete_member({ networkId: "8056c2e21c000001", memberId: value }, v2Context(fetcher)),
      );
      await expectRejected((fetcher) =>
        zerotierActionHandlers.update_member(
          { networkId: "8056c2e21c000001", memberId: value, name: "pwned" },
          v2Context(fetcher),
        ),
      );
      await expectRejected((fetcher) =>
        zerotierActionHandlers.delete_user_token({ userId: "user-1", tokenName: value }, v1Context(fetcher)),
      );
      await expectRejected((fetcher) =>
        zerotierActionHandlers.delete_network({ networkId: value }, v1Context(fetcher)),
      );
      await expectRejected((fetcher) =>
        zerotierActionHandlers.create_network({ networkGroupId: value, name: "lab" }, v2Context(fetcher)),
      );
      await expectRejected((fetcher) => zerotierActionHandlers.get_org({ orgId: value }, v2Context(fetcher)));
    },
  );

  it("encodes other characters inside one segment", async () => {
    const fetcher = jsonFetcher({}, (url) => {
      expect(url).toBe(`${zerotierV1BaseUrl}/user/user-1/token/ci%20token%3F`);
    });
    await zerotierActionHandlers.delete_user_token({ userId: "user-1", tokenName: "ci token?" }, v1Context(fetcher));
  });
});

describe("ZeroTier list normalization", () => {
  it("wraps bare payloads as a single item", async () => {
    const fetcher = jsonFetcher({ id: "nw1" });
    const result = await zerotierActionHandlers.list_networks({}, v1Context(fetcher));
    expect(result).toEqual({ items: [{ id: "nw1" }] });
  });

  it("returns an empty list for null payloads", async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 204 })) as unknown as typeof fetch;
    const result = await zerotierActionHandlers.list_networks({}, v1Context(fetcher));
    expect(result).toEqual({ items: [] });
  });
});

describe("ZeroTier error propagation", () => {
  it("surfaces upstream error payloads as ProviderRequestError", async () => {
    const fetcher = vi.fn(async () =>
      Response.json({ message: "bad request" }, { status: 400, statusText: "Bad Request" }),
    ) as unknown as typeof fetch;
    const error = await zerotierActionHandlers.list_networks({}, v1Context(fetcher)).catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ProviderRequestError);
    expect((error as ProviderRequestError).status).toBe(400);
  });

  it("keeps the upstream status for non-JSON error bodies", async () => {
    const fetcher = vi.fn(async () => new Response("Unauthorized", { status: 401 })) as unknown as typeof fetch;
    const error = await zerotierActionHandlers.list_networks({}, v1Context(fetcher)).catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ProviderRequestError);
    expect((error as ProviderRequestError).status).toBe(401);
    expect((error as ProviderRequestError).message).toBe("Unauthorized");
  });

  it("lists v2 per-field validation details in the error message", async () => {
    const fetcher = vi.fn(async () =>
      Response.json(
        { code: 400, message: "validation failed", details: [{ field: "name", message: "name too short" }] },
        { status: 400 },
      ),
    ) as unknown as typeof fetch;
    const error = await zerotierActionHandlers
      .update_network({ networkId: "nw1", name: "x" }, v2Context(fetcher))
      .catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ProviderRequestError);
    expect((error as ProviderRequestError).status).toBe(400);
    expect((error as ProviderRequestError).message).toBe("validation failed: name: name too short");
  });

  it("bounds the message taken from a non-JSON error page", async () => {
    const html = `<html><body>502 Bad Gateway${" ".repeat(10)}${"x".repeat(1000)}</body></html>`;
    const fetcher = vi.fn(
      async () => new Response(html, { status: 502, headers: { "content-type": "text/html" } }),
    ) as unknown as typeof fetch;
    const error = await zerotierActionHandlers.list_networks({}, v1Context(fetcher)).catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ProviderRequestError);
    expect((error as ProviderRequestError).status).toBe(502);
    expect((error as ProviderRequestError).message.length).toBeLessThanOrEqual(500);
    expect((error as ProviderRequestError).message.startsWith("<html><body>502 Bad Gateway")).toBe(true);
  });

  it("falls back to the status when a non-JSON error body is blank", async () => {
    const fetcher = vi.fn(async () => new Response("   ", { status: 503 })) as unknown as typeof fetch;
    const error = await zerotierActionHandlers.list_networks({}, v1Context(fetcher)).catch((err: unknown) => err);
    expect((error as ProviderRequestError).status).toBe(503);
    expect((error as ProviderRequestError).message).toBe("ZeroTier request failed with status 503");
  });
});

describe("ZeroTier credential validation", () => {
  it("validates v1 credentials via GET /status and identifies the token user", async () => {
    const status = { type: "CentralStatus", clock: 1, user: { id: "user-1", displayName: "Joe User" } };
    const fetcher = jsonFetcher(status, (url, init) => {
      expect(url).toBe(`${zerotierV1BaseUrl}/status`);
      expect(new Headers(init?.headers).get("authorization")).toBe("token v1-key");
    });
    const result = await credentialValidators.customCredential!(
      { values: { apiVersion: "v1", apiKey: "v1-key" } },
      { fetcher },
    );
    expect(result?.profile).toEqual({ accountId: "user-1", displayName: "Joe User" });
    expect(result?.metadata?.apiBaseUrl).toBe(zerotierV1BaseUrl);
  });

  it("rejects v1 credentials whose status carries no user", async () => {
    const fetcher = jsonFetcher({ type: "CentralStatus", clock: 1, user: null });
    const error = await credentialValidators.customCredential!(
      { values: { apiVersion: "v1", apiKey: "bad-key" } },
      { fetcher },
    ).catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ProviderRequestError);
    expect((error as ProviderRequestError).status).toBe(401);
  });

  it("validates v2 credentials via GET /org and identifies the service account organization", async () => {
    const fetcher = jsonFetcher({ items: [{ id: "org1", name: "Acme Org" }] }, (url, init) => {
      expect(url).toBe(`${zerotierV2BaseUrl}/org`);
      expect(new Headers(init?.headers).get("authorization")).toBe("Bearer v2-key");
    });
    const result = await credentialValidators.customCredential!(
      { values: { apiVersion: "v2", apiKey: "v2-key" } },
      { fetcher },
    );
    expect(result?.profile).toEqual({ accountId: "org1", displayName: "Acme Org" });
    expect(result?.metadata?.apiBaseUrl).toBe(zerotierV2BaseUrl);
  });

  it("uses the configured orgId to pick among several v2 organizations", async () => {
    const orgs = {
      items: [
        { id: "org1", name: "Acme Org" },
        { id: "org2", name: "Beta Org" },
      ],
    };
    const result = await credentialValidators.customCredential!(
      { values: { apiVersion: "v2", apiKey: "v2-key", orgId: "org2" } },
      { fetcher: jsonFetcher(orgs) },
    );
    expect(result?.profile).toEqual({ accountId: "org2", displayName: "Beta Org" });
  });

  const routedFetcher = (routes: Record<string, () => Response>) =>
    vi.fn(async (input: RequestInfo | URL) => {
      const route = routes[input.toString()];
      if (!route) throw new Error(`unexpected request ${input.toString()}`);
      return route();
    }) as unknown as typeof fetch;

  it.each([
    { label: "one listed organization", items: [{ id: "org-real", name: "Real Org" }] },
    {
      label: "several listed organizations",
      items: [
        { id: "org1", name: "Acme Org" },
        { id: "org2", name: "Beta Org" },
      ],
    },
  ])("rejects a configured v2 orgId the key cannot reach with $label", async ({ items }) => {
    const fetcher = routedFetcher({
      [`${zerotierV2BaseUrl}/org`]: () => Response.json({ items }),
      [`${zerotierV2BaseUrl}/org/org-typo`]: () => Response.json({ message: "forbidden" }, { status: 403 }),
    });
    const error = await credentialValidators.customCredential!(
      { values: { apiVersion: "v2", apiKey: "v2-key", orgId: "org-typo" } },
      { fetcher },
    ).catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ProviderRequestError);
    expect((error as ProviderRequestError).status).toBe(403);
  });

  it("looks up a configured v2 orgId that GET /org does not list", async () => {
    const fetcher = routedFetcher({
      [`${zerotierV2BaseUrl}/org`]: () => Response.json({ items: [{ id: "org1", name: "Acme Org" }] }),
      [`${zerotierV2BaseUrl}/org/org2`]: () => Response.json({ id: "org2", name: "Beta Org" }),
    });
    const result = await credentialValidators.customCredential!(
      { values: { apiVersion: "v2", apiKey: "v2-key", orgId: "org2" } },
      { fetcher },
    );
    expect(result?.profile).toEqual({ accountId: "org2", displayName: "Beta Org" });
  });

  it("leaves the v2 account id to the runtime default when no single organization is identified", async () => {
    const orgs = {
      items: [
        { id: "org1", name: "Acme Org" },
        { id: "org2", name: "Beta Org" },
      ],
    };
    const result = await credentialValidators.customCredential!(
      { values: { apiVersion: "v2", apiKey: "v2-key" } },
      { fetcher: jsonFetcher(orgs) },
    );
    expect(result?.profile).toEqual({ accountId: undefined, displayName: "ZeroTier New Central v2" });
  });
});

describe("ZeroTier action schemas", () => {
  const action = (name: string) => zerotierActions.find((candidate) => candidate.name === name)!;

  it("treats check_permissions as a read and accepts the v2 resource types", () => {
    const checkPermissions = action("check_permissions");
    const check = (resourceType: string) => ({ checks: [{ permission: "read", resourceType, resourceId: "r1" }] });

    expect(checkPermissions.operationType).toBe("read");
    expect(validateActionInput(checkPermissions, check("network_group")).valid).toBe(true);
    expect(validateActionInput(checkPermissions, check("networkGroup")).valid).toBe(false);
  });

  it("marks IAM and network permission revocation or replacement as destructive", () => {
    expect(action("replace_iam").operationType).toBe("destructive");
    expect(action("remove_iam").operationType).toBe("destructive");
    expect(action("set_network_user_permissions").operationType).toBe("destructive");
    expect(action("add_iam").operationType).toBe("write");
  });

  it("accepts only upstream IAM roles and email principals", () => {
    const addIam = action("add_iam");
    const input = (principal: string, roles: string[]) => ({
      resourceType: "org",
      resourceId: "org1",
      principal,
      roles,
    });
    expect(validateActionInput(addIam, input("alice@example.com", ["Admin", "NetworkViewer"])).valid).toBe(true);
    expect(validateActionInput(addIam, input("alice@example.com", [])).valid).toBe(false);
    expect(validateActionInput(addIam, input("alice@example.com", ["Superuser"])).valid).toBe(false);
    expect(validateActionInput(addIam, input("alice@example.com", ["Admin", "Admin"])).valid).toBe(false);
    expect(validateActionInput(addIam, input("alice", ["Admin"])).valid).toBe(false);
    expect(
      validateActionInput(action("replace_iam"), {
        resourceType: "network",
        resourceId: "nw1",
        assignments: [{ principal: "bob@example.com", roles: ["Owner"] }],
      }).valid,
    ).toBe(true);
    expect(
      validateActionInput(action("replace_iam"), {
        resourceType: "network",
        resourceId: "nw1",
        assignments: [{ principal: "bob@example.com", roles: ["Root"] }],
      }).valid,
    ).toBe(false);
  });

  it("limits principal searches to the user principal type", () => {
    const searchPrincipals = action("search_principals");
    const input = (principalType: string[]) => ({ orgId: "org1", search: "alice", principalType });
    expect(validateActionInput(searchPrincipals, input(["user"])).valid).toBe(true);
    expect(validateActionInput(searchPrincipals, input(["service_account"])).valid).toBe(false);
  });

  it("applies the upstream webhook limits", () => {
    const createWebhook = action("create_webhook");
    const webhook = { orgId: "org1", url: "https://hooks.example.com/zt", eventList: ["network.created"] };
    expect(validateActionInput(createWebhook, webhook).valid).toBe(true);
    expect(validateActionInput(createWebhook, { ...webhook, eventList: [] }).valid).toBe(false);
    expect(validateActionInput(createWebhook, { ...webhook, description: "x".repeat(256) }).valid).toBe(false);
    expect(validateActionInput(action("update_webhook"), { webhookId: "wh1", eventList: [] }).valid).toBe(false);

    const rotate = action("rotate_webhook_secret");
    expect(validateActionInput(rotate, { webhookId: "wh1", overlapHours: 0 }).valid).toBe(true);
    expect(validateActionInput(rotate, { webhookId: "wh1", overlapHours: 720 }).valid).toBe(true);
    expect(validateActionInput(rotate, { webhookId: "wh1", overlapHours: 721 }).valid).toBe(false);
    expect(validateActionInput(rotate, { webhookId: "wh1", overlapHours: -1 }).valid).toBe(false);
  });

  it("requires 10-hex-digit device IDs for the v2 batch member actions", () => {
    expect(validateActionInput(action("remove_members"), { networkId: "nw1", deviceIds: ["abcdef0123"] }).valid).toBe(
      true,
    );
    expect(validateActionInput(action("authorize_members"), { networkId: "nw1", deviceIds: [".."] }).valid).toBe(false);
    expect(
      validateActionInput(action("add_members"), { networkId: "nw1", members: [{ deviceId: "abcdef012" }] }).valid,
    ).toBe(false);
  });

  it("only requires deviceId for each member added in bulk", () => {
    const addMembers = action("add_members");
    expect(validateActionInput(addMembers, { networkId: "nw1", members: [{ deviceId: "abcdef0123" }] }).valid).toBe(
      true,
    );
    expect(validateActionInput(addMembers, { networkId: "nw1", members: [{ name: "laptop" }] }).valid).toBe(false);
  });

  it("requires a token value of at least 32 characters for add_user_token", () => {
    const addUserToken = action("add_user_token");
    expect(validateActionInput(addUserToken, { userId: "u1", tokenName: "ci" }).valid).toBe(false);
    expect(validateActionInput(addUserToken, { userId: "u1", tokenName: "ci", token: "short" }).valid).toBe(false);
    expect(validateActionInput(addUserToken, { userId: "u1", tokenName: "ci", token: "x".repeat(32) }).valid).toBe(
      true,
    );
  });
});
