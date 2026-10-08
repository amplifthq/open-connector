import type { ProviderDefinition } from "../../core/types.ts";

import { neteaseEnterpriseMailActions } from "./actions.ts";

export const nodeOnly = true;

export const provider: ProviderDefinition = {
  service: "netease_enterprise_mail",
  displayName: "NetEase Enterprise Mail",
  description:
    "Unavailable on Cloudflare Workers. NetEase Enterprise Mail requires IMAP/SMTP, so run this provider from the Node.js runtime.",
  categories: ["Communication", "Productivity"],
  authTypes: ["custom_credential"],
  auth: [
    {
      type: "custom_credential",
      fields: [
        {
          key: "email",
          label: "Email Address",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "user@example.com",
          description: "The full NetEase Enterprise Mail address to connect.",
        },
        {
          key: "authorizationCode",
          label: "Client Authorization Password",
          inputType: "password",
          required: true,
          secret: true,
          placeholder: "client authorization password",
          description:
            "The client authorization password generated for third-party mail clients: https://mail.qiye.163.com/static/commonweb/authcode.html?p=qiye-authcode. This is not the web login password.",
        },
      ],
      testAction: { actionName: "list_folders", input: {} },
    },
  ],
  homepageUrl: "https://qiye.163.com/",
  actions: neteaseEnterpriseMailActions,
};
