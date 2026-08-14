import { describe, expect, it } from "vitest";
import { provider } from "./definition.ts";

describe("Cloudflare Browser Run provider definition", () => {
  it("offers Cloudflare OAuth with the Browser Run scopes", () => {
    const oauth = provider.auth.find((auth) => auth.type === "oauth2");

    expect(provider.authTypes).toEqual(["api_key", "oauth2"]);
    expect(oauth).toMatchObject({
      authorizationUrl: "https://dash.cloudflare.com/oauth2/auth",
      tokenUrl: "https://dash.cloudflare.com/oauth2/token",
      refreshTokenUrl: "https://dash.cloudflare.com/oauth2/token",
      scopes: ["browser-rendering.read", "browser-rendering.write"],
      tokenEndpointAuthMethod: "client_secret_basic",
    });
  });
});
