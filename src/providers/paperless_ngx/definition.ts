import type { ProviderDefinition } from "../../core/types.ts";

import { paperlessNgxActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "paperless_ngx",
  displayName: "Paperless-ngx",
  description:
    "Manage documents, metadata, workflows, mail ingestion, users, tasks, and system settings on a self-hosted Paperless-ngx instance.",
  categories: ["Documents", "Productivity"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Token",
      placeholder: "Enter your Paperless-ngx API token",
      description:
        "A token from My Profile in your Paperless-ngx instance. It is sent as Authorization: Token. See https://docs.paperless-ngx.com/api/.",
      extraFields: [
        {
          key: "baseUrl",
          label: "Instance URL",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "https://paperless.example.com",
          description:
            "The HTTP or HTTPS root URL of your Paperless-ngx instance, including a reverse-proxy subpath. Private-network instances require OOMOL_CONNECT_ALLOW_PRIVATE_NETWORK in a self-hosted Node deployment.",
        },
      ],
    },
  ],
  homepageUrl: "https://docs.paperless-ngx.com",
  actions: paperlessNgxActions,
};
