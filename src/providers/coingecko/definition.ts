import type { ProviderDefinition } from "../../core/types.ts";

import { coingeckoActions } from "./actions.ts";

const service = "coingecko";

export const provider: ProviderDefinition = {
  service,
  displayName: "CoinGecko",
  categories: ["Finance", "Data"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "CoinGecko API key",
      description:
        "Create a Demo or Pro API key in the CoinGecko Developer Dashboard: https://www.coingecko.com/en/developers/dashboard#api-keys. Select the matching plan below.",
      extraFields: [
        {
          key: "plan",
          label: "API Plan",
          required: true,
          secret: false,
          inputType: "text",
          placeholder: "demo or pro",
          description:
            "Use demo for the free Demo API or pro for any paid API plan. The plan selects the API host and authentication header.",
        },
      ],
    },
  ],
  homepageUrl: "https://www.coingecko.com",
  actions: coingeckoActions,
};
