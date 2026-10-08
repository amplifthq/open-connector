import type { ProviderDefinition } from "../../core/types.ts";

import { sorftimeMcpActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "sorftime_mcp",
  displayName: "Sorftime MCP",
  categories: ["Data", "Marketing", "Cross Border E-commerce"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "MCP Key",
      placeholder: "Sorftime MCP Key",
      description:
        "Get your MCP key at https://seller.sorftime.com/mcp?apk=1. It is the key parameter in your MCP service URL.",
    },
  ],
  homepageUrl: "https://www.sorftime.com/",
  actions: sorftimeMcpActions,
};
