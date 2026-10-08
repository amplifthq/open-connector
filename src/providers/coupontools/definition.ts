import type { ProviderDefinition } from "../../core/types.ts";

import { coupontoolsActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "coupontools",
  displayName: "Coupontools",
  categories: ["Marketing"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "Client ID",
      placeholder: "COUPONTOOLS_CLIENT_ID",
      description:
        "Coupontools API client ID. Find it under Integrations > JSON API in the Coupontools dashboard: https://login.coupontools.com/.",
      extraFields: [
        {
          key: "clientSecret",
          label: "Client Secret",
          inputType: "password",
          required: true,
          secret: true,
          placeholder: "COUPONTOOLS_CLIENT_SECRET",
          description:
            "Coupontools API client secret paired with the client ID. Find it under Integrations > JSON API in the Coupontools dashboard: https://login.coupontools.com/.",
        },
      ],
    },
  ],
  homepageUrl: "https://www.coupontools.com",
  actions: coupontoolsActions,
};
