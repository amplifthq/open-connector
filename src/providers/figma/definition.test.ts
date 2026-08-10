import { describe, expect, it } from "vitest";
import { provider } from "./definition.ts";

describe("Figma provider definition", () => {
  it("uses Figma's public OAuth endpoints with PKCE and refresh support", () => {
    const oauth = provider.auth.find((auth) => auth.type === "oauth2");

    expect(oauth).toMatchObject({
      authorizationUrl: "https://www.figma.com/oauth",
      tokenUrl: "https://api.figma.com/v1/oauth/token",
      refreshTokenUrl: "https://api.figma.com/v1/oauth/refresh",
      tokenEndpointAuthMethod: "client_secret_basic",
      pkce: { method: "S256" },
      tokenRequestFields: {
        clientId: false,
        refresh: { grantType: false },
      },
    });
  });
});
