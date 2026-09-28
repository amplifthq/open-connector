import type { ConnectionService } from "../../connection-service.ts";

import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { createLocalAuthMiddleware } from "./auth.ts";
import { handleGitUploadPack } from "./git-upload-pack.ts";

const adminToken = "test-admin-only";
const requesterHeaders = {
  authorization: `Bearer ${adminToken}`,
  "x-openmeld-organization-id": "org_test",
  "x-openmeld-requester-user-id": "user_one",
  "x-openmeld-operation-id": "checkout_1",
  "x-openmeld-repository": "amplifthq/openmeld",
};

function createApp(
  fetcher: typeof fetch,
  getCredential = vi.fn(async (_service: string, _connectionName: string) => ({
    authType: "oauth2" as const,
    accessToken: "test-github-only",
  })),
) {
  const app = new Hono();
  const auth = { adminToken, runtimeToken: "runtime-token" };
  const connections = { getCredential } as unknown as ConnectionService;
  app.use("*", createLocalAuthMiddleware(auth));
  app.get("/api/openmeld/git/:owner/:repo/info/refs", (context) =>
    handleGitUploadPack(context, {
      auth,
      connections,
      fetcher,
      operation: "advertise",
      owner: context.req.param("owner"),
      repo: context.req.param("repo"),
    }),
  );
  app.post("/api/openmeld/git/:owner/:repo/git-upload-pack", (context) =>
    handleGitUploadPack(context, {
      auth,
      connections,
      fetcher,
      operation: "upload",
      owner: context.req.param("owner"),
      repo: context.req.param("repo"),
    }),
  );
  return { app, getCredential };
}

describe("OpenMeld Git upload-pack streaming", () => {
  it("requires the administrator bearer and derives a member connection on every request", async () => {
    const fetchMock = vi.fn(
      async (_url: string | URL | Request, init?: RequestInit) =>
        new Response("0000", {
          headers: {
            "content-type":
              init?.method === "GET"
                ? "application/x-git-upload-pack-advertisement"
                : "application/x-git-upload-pack-result",
          },
        }),
    );
    const { app, getCredential } = createApp(fetchMock as unknown as typeof fetch);
    const url = "/api/openmeld/git/amplifthq/openmeld/info/refs?service=git-upload-pack";

    expect((await app.request(url)).status).toBe(401);
    expect(
      (await app.request(url, { headers: { ...requesterHeaders, authorization: "Bearer runtime-token" } })).status,
    ).toBe(401);
    expect((await app.request(url, { headers: requesterHeaders })).status).toBe(200);
    expect(
      (await app.request(url, { headers: { ...requesterHeaders, "x-openmeld-requester-user-id": "user_two" } })).status,
    ).toBe(200);
    expect(getCredential).toHaveBeenCalledTimes(2);
    expect(getCredential.mock.calls[0]?.[1]).toMatch(/^org_[A-Za-z0-9_-]{18}__user_[A-Za-z0-9_-]{18}__github$/u);
    expect(getCredential.mock.calls[0]?.[1]).not.toBe(getCredential.mock.calls[1]?.[1]);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://github.com/amplifthq/openmeld.git/info/refs?service=git-upload-pack",
    );
    expect(fetchMock.mock.calls[0]?.[1]?.redirect).toBe("manual");
  });

  it("streams the upload body and pack response without buffering", async () => {
    let pushResponseChunk: ((value: Uint8Array) => void) | undefined;
    const upstream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("first"));
        pushResponseChunk = (value) => {
          controller.enqueue(value);
          controller.close();
        };
      },
    });
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(init?.body).toBeInstanceOf(ReadableStream);
      expect(init?.method).toBe("POST");
      expect(init?.headers).toBeInstanceOf(Headers);
      return new Response(upstream, { headers: { "content-type": "application/x-git-upload-pack-result" } });
    }) as unknown as typeof fetch;
    const { app } = createApp(fetcher);
    const response = await app.request("/api/openmeld/git/amplifthq/openmeld/git-upload-pack", {
      method: "POST",
      headers: { ...requesterHeaders, "content-type": "application/x-git-upload-pack-request" },
      body: "0000",
    });
    expect(response.status).toBe(200);
    const reader = response.body?.getReader();
    expect(reader).toBeDefined();
    expect(new TextDecoder().decode((await reader!.read()).value)).toBe("first");
    pushResponseChunk?.(new TextEncoder().encode("second"));
    expect(new TextDecoder().decode((await reader!.read()).value)).toBe("second");
  });

  it("rejects receive-pack, malformed selectors, redirects and unavailable member credentials", async () => {
    const fetchMock = vi.fn(
      async () => new Response(null, { status: 302, headers: { location: "https://other.example/" } }),
    );
    const getCredential = vi.fn(async (_service: string, _connectionName: string) => ({
      authType: "oauth2" as const,
      accessToken: "test-github-only",
    }));
    const { app } = createApp(fetchMock as unknown as typeof fetch, getCredential);
    const scopedHeaders = { ...requesterHeaders, "x-openmeld-repository": "a/b" };
    expect(
      (await app.request("/api/openmeld/git/a/b/git-receive-pack", { method: "POST", headers: requesterHeaders }))
        .status,
    ).toBe(404);
    expect(
      (await app.request("/api/openmeld/git/a/b/info/refs?service=git-upload-pack", { headers: requesterHeaders }))
        .status,
    ).toBe(400);
    expect(
      (await app.request("/api/openmeld/git/a/b/info/refs?service=git-receive-pack", { headers: scopedHeaders }))
        .status,
    ).toBe(400);
    expect(
      (
        await app.request("/api/openmeld/git/a/b/info/refs?service=git-upload-pack&extra=1", {
          headers: scopedHeaders,
        })
      ).status,
    ).toBe(400);
    expect(
      (await app.request("/api/openmeld/git/a/b/info/refs?service=git-upload-pack", { headers: scopedHeaders })).status,
    ).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    getCredential.mockRejectedValueOnce(new Error("disconnected"));
    expect(
      (await app.request("/api/openmeld/git/a/b/info/refs?service=git-upload-pack", { headers: scopedHeaders })).status,
    ).toBe(404);
  });
});
