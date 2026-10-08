import type { ProviderDefinition } from "../../core/types.ts";

import { tongdaxinActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "tongdaxin",
  displayName: "Tongdaxin",
  description:
    "Query Tongdaxin market data, screening, news, announcements, and research through its official MCP service.",
  categories: ["Finance", "Data"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "Paste your Tongdaxin API Key",
      description:
        "API Key sent as a Bearer credential to Tongdaxin MCP. Create a key with data-service permission at https://vip.tdx.com.cn/site/app/pc-mall/main.html#/aiKey.",
    },
  ],
  homepageUrl: "https://vip.tdx.com.cn/site/app/pc-mall/main.html#/page_product_mcp",
  actions: tongdaxinActions,
};
