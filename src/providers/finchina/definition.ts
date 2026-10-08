import type { ProviderDefinition } from "../../core/types.ts";

import { finchinaActions } from "./actions.ts";
export const provider: ProviderDefinition = {
  service: "finchina",
  displayName: "FinChina",
  homepageUrl: "https://mcp.finchina.com",
  categories: ["Finance", "Data"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      ...{
        label: "API Key",
        placeholder: "ak_...",
        description:
          "Register or sign in at https://mcp.finchina.com/intro to obtain your FinChina API Key. Queries consume FinChina credits; some advanced datasets require account verification. The key is sent in the x-api-key header.",
      },
    },
  ],
  actions: finchinaActions,
};
