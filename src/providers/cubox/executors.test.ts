import { describe, expect, it, vi } from "vitest";
import { credentialValidators, cuboxActionHandlers, normalizeCuboxApiUrl } from "./executors.ts";

describe("normalizeCuboxApiUrl", () => {
  it("accepts the official Cubox API Extension URL shape", () => {
    expect(normalizeCuboxApiUrl("https://cubox.pro/c/api/save/example-token")).toBe(
      "https://cubox.pro/c/api/save/example-token",
    );
  });

  it("rejects non-Cubox origins and unsupported paths", () => {
    expect(() => normalizeCuboxApiUrl("https://example.com/c/api/save/example-token")).toThrow(
      "must use https://cubox.pro",
    );
    expect(() => normalizeCuboxApiUrl("https://cubox.pro/c/api/read/example-token")).toThrow(
      "must be a Cubox API Extension save URL",
    );
    expect(() => normalizeCuboxApiUrl("https://cubox.pro/c/api/save/example-token?next=https://example.com")).toThrow(
      "must be a Cubox API Extension save URL",
    );
  });
});

describe("Cubox credentials", () => {
  it("rejects invalid API URLs before storing the credential", async () => {
    const fetcher = vi.fn(async () => Response.json({}));

    await expect(
      credentialValidators.customCredential!(
        { values: { apiUrl: "https://example.com/c/api/save/example-token" } },
        { fetcher },
      ),
    ).rejects.toThrow("must use https://cubox.pro");
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("Cubox actions", () => {
  it("rejects cloud metadata URLs before calling Cubox", async () => {
    const fetcher = vi.fn(async () => Response.json({ code: 200 }));

    await expect(
      cuboxActionHandlers.save_url(
        { url: "http://169.254.169.254/latest/meta-data" },
        { apiUrl: "https://cubox.pro/c/api/save/example-token", fetcher },
      ),
    ).rejects.toThrow("url must not target private or reserved IP addresses");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("saves a URL with optional metadata and normalizes the successful response", async () => {
    const apiUrl = "https://cubox.pro/c/api/save/example-token";
    const fetcher: typeof fetch = async (input, init) => {
      expect(input.toString()).toBe(apiUrl);
      expect(init?.method).toBe("POST");
      expect(new Headers(init?.headers).get("content-type")).toBe("application/json");
      expect(JSON.parse(String(init?.body))).toEqual({
        type: "url",
        content: "https://example.com/article",
        title: "Example article",
        description: "Saved from OpenConnector",
        tags: ["reading", "open-connector"],
        folder: "Inbox",
      });
      return Response.json({ code: 200, message: "", data: null });
    };

    await expect(
      cuboxActionHandlers.save_url(
        {
          url: "https://example.com/article",
          title: "Example article",
          description: "Saved from OpenConnector",
          tags: ["reading", "open-connector"],
          folder: "Inbox",
        },
        { apiUrl, fetcher },
      ),
    ).resolves.toEqual({ queued: true });
  });
});
