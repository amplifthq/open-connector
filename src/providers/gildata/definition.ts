import type { ProviderDefinition } from "../../core/types.ts";

import { gildataActions } from "./actions.ts";
export const provider: ProviderDefinition = {
  service: "gildata",
  displayName: "Gildata Data Map",
  homepageUrl: "https://www.gildata.com/products/datamap",
  categories: ["Finance", "Data"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      ...{
        label: "JY_API_KEY",
        placeholder: "Paste your Gildata JY_API_KEY",
        description:
          "The JY_API_KEY used to access Gildata Data Map MCP financial data services. Request access through the official Data Map product page at https://www.gildata.com/products/datamap.",
      },
    },
  ],
  actions: gildataActions,
};
