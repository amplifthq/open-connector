import { describe, expect, it } from "vitest";
import { provider } from "./definition.ts";
import { figmaPersonalAccessTokenScopes } from "./scopes.ts";

describe("Figma provider definition", () => {
  it("uses Figma's public OAuth endpoints with PKCE and refresh support", () => {
    const oauth = provider.auth.find((auth) => auth.type === "oauth2");

    expect(oauth).toMatchObject({
      authorizationUrl: "https://www.figma.com/oauth",
      tokenUrl: "https://api.figma.com/v1/oauth/token",
      scopes: [
        "current_user:read",
        "file_metadata:read",
        "file_content:read",
        "file_versions:read",
        "file_comments:read",
        "file_comments:write",
        "library_content:read",
        "library_assets:read",
        "file_dev_resources:read",
        "file_dev_resources:write",
      ],
      tokenEndpointAuthMethod: "client_secret_basic",
      pkce: { method: "S256" },
      tokenRequestFields: {
        clientId: false,
        refresh: { grantType: "grant_type" },
      },
    });
    expect(oauth).not.toHaveProperty("refreshTokenUrl");
    expect(oauth?.scopes).not.toContain("projects:read");
    expect(oauth?.scopes).not.toContain("project_metadata:read");
  });

  it("keeps private project capabilities available to personal access tokens", () => {
    expect(figmaPersonalAccessTokenScopes).toEqual(expect.arrayContaining(["projects:read", "project_metadata:read"]));
  });
});
