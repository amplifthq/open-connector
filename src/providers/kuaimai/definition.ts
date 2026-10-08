import type { ProviderDefinition } from "../../core/types.ts";

import { kuaimaiActions } from "./actions.ts";

const documentationUrl =
  "https://open.kuaimai.com/docs/api/API%E5%AF%B9%E6%8E%A5%E8%AF%B4%E6%98%8E/%E6%8E%A5%E5%85%A5%E6%8C%87%E5%8D%97/";

export const provider: ProviderDefinition = {
  service: "kuaimai",
  displayName: "Kuaimai ERP",
  categories: ["Productivity", "Data", "Cross Border E-commerce"],
  authTypes: ["custom_credential"],
  auth: [
    {
      type: "custom_credential",
      fields: [
        {
          key: "appKey",
          label: "APP Key",
          required: true,
          secret: false,
          inputType: "text",
          placeholder: "Paste your Kuaimai APP Key",
          description:
            "The application key issued after Kuaimai approves Open Platform access: https://open.kuaimai.com/applyApp/",
        },
        {
          key: "appSecret",
          label: "APP Secret",
          required: true,
          secret: true,
          inputType: "password",
          placeholder: "Paste your Kuaimai APP Secret",
          description: `The secret paired with the approved APP Key and used to sign requests. See ${documentationUrl}`,
        },
        {
          key: "accessToken",
          label: "Access Token",
          required: true,
          secret: true,
          inputType: "password",
          placeholder: "Paste your Kuaimai access token",
          description: `The Open Platform session token sent on each request. See ${documentationUrl}`,
        },
        {
          key: "refreshToken",
          label: "Refresh Token",
          required: true,
          secret: true,
          inputType: "password",
          placeholder: "Paste your Kuaimai refresh token",
          description: `The token used to extend the Open Platform session. See ${documentationUrl}`,
        },
      ],
      testAction: { actionName: "list_warehouses", input: {} },
    },
  ],
  homepageUrl: "https://www.kuaimai.com/",
  actions: kuaimaiActions,
};
