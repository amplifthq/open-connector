import { describe, expect, it, vi } from "vitest";
import { validateCloudflareEmailRoutingCredential, cloudflareEmailRoutingActionHandlers } from "./runtime.ts";

describe("Email Routing credential formats", () => {
  it.each(["cfut_current", "legacyUserTokenWithoutPrefix"])(
    "uses bearer authentication for %s without an email",
    async (apiKey) => {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValue(Response.json({ success: true, result: { id: "token-1", status: "active" } }));
      await validateCloudflareEmailRoutingCredential({ apiKey }, fetcher);
      expect(fetcher.mock.calls[0]?.[0]).toBe("https://api.cloudflare.com/client/v4/user/tokens/verify");
      expect(fetcher.mock.calls[0]?.[1]?.headers).toMatchObject({ authorization: `Bearer ${apiKey}` });
    },
  );
  it("keeps legacy global key authentication when an email is supplied", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ success: true, result: { id: "user-1", email: "test@example.com" } }));
    await validateCloudflareEmailRoutingCredential({ apiKey: "legacy-global-key", email: "test@example.com" }, fetcher);
    expect(fetcher.mock.calls[0]?.[1]?.headers).toMatchObject({
      "x-auth-key": "legacy-global-key",
      "x-auth-email": "test@example.com",
    });
  });
  it("uses the same legacy token authentication when executing", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ success: true, result: [] }));
    await cloudflareEmailRoutingActionHandlers.list_destination_addresses!(
      {},
      { apiKey: "legacyUserToken", accountId: "account-1", zoneId: "zone-1", fetcher },
    );
    expect(fetcher.mock.calls[0]?.[1]?.headers).toMatchObject({ authorization: "Bearer legacyUserToken" });
  });
  it("rejects inactive tokens", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ success: true, result: { id: "token-1", status: "expired" } }));
    await expect(validateCloudflareEmailRoutingCredential({ apiKey: "cfut_expired" }, fetcher)).rejects.toThrow(
      "not active",
    );
  });
});
