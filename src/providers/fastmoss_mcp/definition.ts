import type { ProviderDefinition } from "../../core/types.ts";

import { fastmossMcpActions } from "./actions.ts";
export const provider: ProviderDefinition = {
  service: "fastmoss_mcp",
  displayName: "FastMoss MCP",
  homepageUrl: "https://www.fastmoss.com/zh",
  categories: ["Data", "Marketing", "Cross-border Ecommerce"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      ...{
        label: "MCP API Key",
        placeholder: "Paste your FastMoss MCP API key",
        description:
          "Sign in to https://developers.fastmoss.com/ to create an MCP API key and manage MCP Credits. Copy the key following https://developer.fastmoss.com/zh/docs/mcp/setup. Use a key enabled for MCP; REST API purchases and website memberships do not establish MCP access.",
      },
    },
  ],
  actions: fastmossMcpActions,
};
