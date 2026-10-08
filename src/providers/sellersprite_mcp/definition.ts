import type { ProviderDefinition } from "../../core/types.ts";

import { sellerspriteMcpActions } from "./actions.ts";
export const provider: ProviderDefinition = {
  service: "sellersprite_mcp",
  displayName: "SellerSprite MCP",
  categories: ["Data", "Marketing"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "MCP Secret Key",
      placeholder: "Paste your SellerSprite MCP secret key",
      description: "SellerSprite MCP secret key from https://open.sellersprite.com/mcp.",
    },
  ],
  homepageUrl: "https://open.sellersprite.com/mcp",
  actions: sellerspriteMcpActions,
};
