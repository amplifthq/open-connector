import type { ProviderDefinition } from "../../core/types.ts";

import { xydcMcpActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "xydc_mcp",
  displayName: "XYDC MCP",
  categories: ["Data", "Marketing", "E-commerce"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "MCP Token",
      placeholder: "Paste your XYDC MCP Token",
      description:
        "Copy your MCP Token from the XYDC platform console for Authorization bearer authentication. Follow https://platform.xydc.com/docs/mcp-access. Use the MCP Token, not a REST API Key.",
    },
  ],
  homepageUrl: "https://platform.xydc.com/mcp",
  actions: xydcMcpActions,
};
