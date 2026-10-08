import type { ProviderDefinition } from "../../core/types.ts";

import { tiktokBusinessMcpActions } from "./actions.ts";

const scopes = ["mcp:tt4b"];

export const provider: ProviderDefinition = {
  service: "tiktok_business_mcp",
  displayName: "TikTok for Business MCP",
  description: "Use the official TikTok for Business MCP tools for advertising workflows.",
  categories: ["Marketing", "Advertising"],
  authTypes: ["oauth2"],
  auth: [
    {
      type: "oauth2",
      authorizationUrl: "https://business-api.tiktok.com/portal/mcp-tt4b-authorize",
      tokenUrl: "https://business-api.tiktok.com/open_mcp/tt-ads-mcp-flat/oauth/token",
      refreshTokenUrl: "https://business-api.tiktok.com/open_mcp/tt-ads-mcp-flat/oauth/token",
      scopes,
      tokenEndpointAuthMethod: "client_secret_post",
      pkce: { method: "S256" },
      authorizationParams: {
        resource: "https://business-api.tiktok.com/open_mcp/tt-ads-mcp-flat",
      },
      clientSetup: {
        docsUrl: "https://business-api.tiktok.com/portal/docs",
        steps: [
          "Create a TikTok for Business developer application with MCP access.",
          "Add the callback URL shown here to the application's redirect URLs.",
          "Copy the client ID and client secret into OOMOL Connect.",
        ],
      },
    },
  ],
  homepageUrl: "https://business.tiktok.com",
  actions: tiktokBusinessMcpActions,
};
