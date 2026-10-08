import type { ProviderDefinition } from "../../core/types.ts";

import { airmeetActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "airmeet",
  displayName: "Airmeet",
  categories: ["Communication", "Marketing"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "Secret Key",
      placeholder: "X-AIRMEET-SECRET-KEY",
      description:
        "Airmeet Secret Key paired with an Access Key. Generate both in the Airmeet Community Dashboard under Integrations > API Access Key: https://www.airmeet.com/",
      extraFields: [
        {
          key: "accessKey",
          label: "Access Key",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "X-AIRMEET-ACCESS-KEY",
          description:
            "Airmeet Access Key paired with the Secret Key. Generate both in the Airmeet Community Dashboard under Integrations > API Access Key: https://www.airmeet.com/",
        },
        {
          key: "region",
          label: "Region",
          inputType: "text",
          required: false,
          secret: false,
          placeholder: "default",
          description:
            "Airmeet community data region: default for Mumbai, eu for Europe, or us for the United States. The default is default. See https://help.airmeet.com/support/solutions/articles/82000909768-1-event-details-airmeet-public-api",
        },
      ],
    },
  ],
  homepageUrl: "https://www.airmeet.com/",
  actions: airmeetActions,
};
