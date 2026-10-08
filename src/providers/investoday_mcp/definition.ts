import type { ProviderDefinition } from "../../core/types.ts";

import { investodayMcpActions } from "./actions.ts";
export const provider: ProviderDefinition = {
  service: "investoday_mcp",
  displayName: "Investoday MCP",
  homepageUrl: "https://data-api.investoday.net/mcp",
  categories: ["Finance", "Data"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      ...{
        label: "API Key",
        placeholder: "Paste your Investoday MCP API Key",
        description:
          "Sign in to https://data-api.investoday.net and open Personal Center > My Applications to create a personalized MCP application, authorize at least one data API, and copy its dedicated API Key. Ordinary API keys for the preset MCP service cannot be used with this connection.",
      },
    },
  ],
  actions: investodayMcpActions,
};
