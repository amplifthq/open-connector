import type { ProviderDefinition } from "../../core/types.ts";

import { kingdeeActions } from "./actions.ts";

const authorizationHelp =
  "Configure a third-party application and authorize its user in Kingdee Cloud Galaxy Enterprise.";

export const provider: ProviderDefinition = {
  service: "kingdee",
  displayName: "Kingdee",
  categories: ["Finance"],
  authTypes: ["custom_credential"],
  auth: [
    {
      type: "custom_credential",
      fields: [
        {
          key: "baseUrl",
          label: "Enterprise Application URL",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "https://erp.example.com/k3cloud/",
          description: "HTTPS URL of your Kingdee Cloud Galaxy Enterprise application.",
        },
        {
          key: "dataCenterId",
          label: "Data Center ID",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "YOUR_DATA_CENTER_ID",
          description: `The account-set ID, preserved as a string; this is not an organization ID. ${authorizationHelp}`,
        },
        {
          key: "username",
          label: "Integration Username",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "integration-user",
          description: `The integration user authorized for this application. ${authorizationHelp}`,
        },
        {
          key: "applicationId",
          label: "Application ID",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "YOUR_APPLICATION_ID",
          description: `The Kingdee third-party application ID. ${authorizationHelp}`,
        },
        {
          key: "applicationSecret",
          label: "Application Secret",
          inputType: "password",
          required: true,
          secret: true,
          placeholder: "YOUR_APPLICATION_SECRET",
          description: `The application secret used by LoginByAppSecret. ${authorizationHelp}`,
        },
        {
          key: "localeId",
          label: "Locale ID",
          inputType: "text",
          required: false,
          secret: false,
          placeholder: "2052",
          description: "Optional Kingdee locale ID. The default is Simplified Chinese (2052).",
        },
      ],
    },
  ],
  homepageUrl: "https://www.kingdee.com/cn",
  actions: kingdeeActions,
};
