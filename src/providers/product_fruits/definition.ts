import type { ProviderDefinition } from "../../core/types.ts";

import { productFruitsActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "product_fruits",
  displayName: "Product Fruits",
  categories: ["Marketing", "Documents"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "PRODUCT_FRUITS_API_KEY",
      description:
        "Product Fruits API key sent as a Bearer token. Create it under Integrations > API keys: https://help.productfruits.com/en/article/rest-api-authentication.",
    },
  ],
  homepageUrl: "https://productfruits.com",
  actions: productFruitsActions,
};
