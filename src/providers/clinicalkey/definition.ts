import type { ProviderDefinition } from "../../core/types.ts";

import { clinicalKeyActions } from "./actions.ts";
export const provider: ProviderDefinition = {
  service: "clinicalkey",
  displayName: "ClinicalKey",
  categories: ["Data"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "COUNTER API Key",
      placeholder: "ELSEVIER_COUNTER_API_KEY",
      description: "Elsevier COUNTER 5.1 API key from https://dev.elsevier.com/sushicop5.html",
      extraFields: [
        { key: "requestorId", label: "Requestor ID", inputType: "text", required: true, secret: false },
        { key: "customerId", label: "Customer ID", inputType: "text", required: true, secret: false },
      ],
    },
  ],
  homepageUrl: "https://www.clinicalkey.com/",
  actions: clinicalKeyActions,
};
