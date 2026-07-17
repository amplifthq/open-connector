import { describe, expect, it, vi } from "vitest";
import { credentialValidators } from "./executors.ts";

describe("Cloudflare Browser Rendering credential validation", () => {
  it("verifies a user API token without requiring account token administration permission", async () => {
    const transport = vi.fn(async (_input: RequestInfo | URL) =>
      Response.json({
        errors: [],
        messages: [],
        result: {
          id: "token-id",
          status: "active",
        },
        success: true,
      }),
    );
    const fetcher = transport as unknown as typeof fetch;

    await expect(
      credentialValidators.apiKey!(
        {
          apiKey: "browser-rendering-token",
          values: {
            accountId: "account-id",
            apiKey: "browser-rendering-token",
          },
        },
        { fetcher },
      ),
    ).resolves.toMatchObject({
      metadata: {
        accountId: "account-id",
        validationEndpoint: "/user/tokens/verify",
      },
    });

    expect(transport).toHaveBeenCalledOnce();
    expect(transport.mock.calls[0]?.[0]).toBe("https://api.cloudflare.com/client/v4/user/tokens/verify");
  });
});
