import type { ProviderDefinition } from "../../core/types.ts";

import { ablefyActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "ablefy",
  displayName: "ablefy",
  categories: ["Marketing", "Productivity"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "ABLEFY_API_KEY",
      description:
        "ablefy API key sent as the key query parameter. Generate it under Settings > Integrations > ablefyAPI in your ablefy account: https://app.ablefy.io/.",
      extraFields: [
        {
          key: "apiSecret",
          label: "API Secret",
          inputType: "password",
          required: true,
          secret: true,
          placeholder: "ABLEFY_API_SECRET",
          description:
            "ablefy API secret sent as the secret query parameter. Generate it together with the API key under Settings > Integrations > ablefyAPI: https://app.ablefy.io/.",
        },
      ],
    },
  ],
  homepageUrl: "https://ablefy.io",
  actions: ablefyActions,
};
