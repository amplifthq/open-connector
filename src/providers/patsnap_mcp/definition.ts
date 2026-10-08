import type { ProviderDefinition } from "../../core/types.ts";

import { patsnapMcpActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "patsnap_mcp",
  displayName: "Patsnap MCP",
  categories: ["Data"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "MCP Key",
      placeholder: "Paste your Patsnap MCP Key",
      description:
        "MCP/API Key for Patsnap core patents, patent landscape analytics, and design infringement search, sent as a Bearer header. Access to at least one service is sufficient to connect. Create a key using the instructions at: https://open.patsnap.com/devportal/guides/mcp-quickstart.",
    },
  ],
  homepageUrl: "https://open.patsnap.com/marketplace/mcp-servers",
  actions: patsnapMcpActions,
};
