import type { ProviderDefinition } from "../../core/types.ts";

import { qichachaActions } from "./actions.ts";
export const provider: ProviderDefinition = {
  service: "qichacha",
  displayName: "Qichacha",
  categories: ["Data"],
  authTypes: ["custom_credential"],
  auth: [
    {
      type: "custom_credential",
      fields: [
        {
          key: "appKey",
          label: "AppKey",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "Paste your Qichacha AppKey",
          description: "Qichacha application AppKey from https://openapi.qcc.com/.",
        },
        {
          key: "secretKey",
          label: "SecretKey",
          inputType: "password",
          required: true,
          secret: true,
          placeholder: "Paste your Qichacha SecretKey",
          description: "Qichacha application SecretKey from https://openapi.qcc.com/.",
        },
      ],
    },
  ],
  homepageUrl: "https://openapi.qcc.com/",
  actions: qichachaActions,
};
