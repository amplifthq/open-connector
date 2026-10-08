import type { ProviderDefinition } from "../../core/types.ts";

import { doubaoSeedreamActions } from "./actions.ts";

const service = "doubao_seedream";

export const provider: ProviderDefinition = {
  service,
  displayName: "Doubao Seedream",
  categories: ["AI", "Design & Media"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "Ark API Key",
      placeholder: "Your Doubao Seedream API key",
      description:
        "Doubao Seedream API key sent as a Bearer token. Create an API key in the Ark console: https://console.volcengine.com/ark/region:ark+cn-beijing/apikey.",
    },
  ],
  homepageUrl: "https://www.volcengine.com/product/ark",
  actions: doubaoSeedreamActions,
};
