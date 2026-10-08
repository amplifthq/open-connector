import type { ProviderDefinition } from "../../core/types.ts";

import { embaseActions } from "./actions.ts";
export const provider: ProviderDefinition = {
  service: "embase",
  displayName: "Embase",
  categories: ["Data"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "Elsevier API Key",
      placeholder: "ELSEVIER_API_KEY",
      description: "Elsevier API key from https://dev.elsevier.com/apikey/manage",
      extraFields: [
        { key: "institutionToken", label: "Institutional Token", inputType: "password", required: false, secret: true },
      ],
    },
  ],
  homepageUrl: "https://www.elsevier.com/products/embase",
  actions: embaseActions,
};
