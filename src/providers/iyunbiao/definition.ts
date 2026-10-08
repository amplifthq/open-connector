import type { ProviderDefinition } from "../../core/types.ts";

import { iyunbiaoActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "iyunbiao",
  displayName: "Yunbiao",
  description: "Manage forms, templates, users, roles, attachments, and cloud files in a Yunbiao application space.",
  categories: ["Productivity", "Data"],
  authTypes: ["custom_credential"],
  auth: [
    {
      type: "custom_credential",
      fields: [
        {
          key: "instanceUrl",
          label: "Instance URL",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "https://free.iyunbiao.cn",
          description: "The HTTP or HTTPS origin of your Yunbiao server, without the application space path.",
        },
        {
          key: "spaceId",
          label: "Application Space ID",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "1538136",
          description: "The application space number in your Yunbiao login URL.",
        },
        {
          key: "appName",
          label: "App Name",
          inputType: "text",
          required: true,
          secret: true,
          description:
            "The appName from a third-party application authorization. See https://docs.iyunbiao.com/openAPI/1",
        },
        {
          key: "appKey",
          label: "App Key",
          inputType: "password",
          required: true,
          secret: true,
          description: "The appKey from the same third-party application authorization.",
        },
        {
          key: "account",
          label: "Account",
          inputType: "text",
          required: true,
          secret: false,
          description: "The Yunbiao account authorized for the required templates.",
        },
        {
          key: "password",
          label: "Password",
          inputType: "password",
          required: false,
          secret: true,
          description: "The account password. Omit when the account is bound as the authorization's default account.",
        },
      ],
    },
  ],
  homepageUrl: "https://www.iyunbiao.com",
  actions: iyunbiaoActions,
};
