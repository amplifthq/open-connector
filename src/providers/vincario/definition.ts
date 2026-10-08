import type { ProviderDefinition } from "../../core/types.ts";

import { vincarioActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "vincario",
  displayName: "Vincario",
  categories: ["Data", "Location"],
  authTypes: ["custom_credential"],
  auth: [
    {
      type: "custom_credential",
      fields: [
        {
          key: "apiKey",
          label: "API Key",
          inputType: "password",
          required: true,
          secret: true,
          placeholder: "VINCARIO_API_KEY",
          description:
            "Vincario API key included in signed request paths. Request API access at https://vincario.com/vin-decoder/#request-free-trial-api-key.",
        },
        {
          key: "secretKey",
          label: "Secret Key",
          inputType: "password",
          required: true,
          secret: true,
          placeholder: "VINCARIO_SECRET_KEY",
          description: "Vincario secret key used locally to calculate request control sums; it is never sent upstream.",
        },
      ],
    },
  ],
  homepageUrl: "https://vincario.com/",
  actions: vincarioActions,
};
