import type { ProviderDefinition } from "../../core/types.ts";

import { justCallActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "justcall",
  displayName: "JustCall",
  categories: ["Communication", "Productivity"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "JUSTCALL_API_KEY",
      description:
        "JustCall API key used with your API secret in the Authorization header. Copy both credentials from https://app.justcall.io/app/developersApiCredentials.",
      extraFields: [
        {
          key: "apiSecret",
          label: "API Secret",
          inputType: "password",
          required: true,
          secret: true,
          placeholder: "JUSTCALL_API_SECRET",
          description:
            "JustCall API secret paired with your API key. Copy it from https://app.justcall.io/app/developersApiCredentials.",
        },
      ],
    },
  ],
  homepageUrl: "https://justcall.io",
  actions: justCallActions,
};
