import type { ProviderDefinition } from "../../core/types.ts";

import { seedanceActions } from "./actions.ts";

const service = "seedance";

export const provider: ProviderDefinition = {
  service,
  displayName: "Seedance",
  categories: ["AI", "Design & Media"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "Ark API Key",
      placeholder: "Your Seedance API key",
      description:
        "Seedance API key sent as a Bearer token. Create an API key in the Ark console: https://console.volcengine.com/ark/region:ark+cn-beijing/apikey.",
    },
  ],
  homepageUrl: "https://www.volcengine.com/product/ark",
  actions: seedanceActions,
};
