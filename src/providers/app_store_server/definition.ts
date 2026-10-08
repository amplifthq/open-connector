import type { ProviderDefinition } from "../../core/types.ts";

import { appStoreServerActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "app_store_server",
  displayName: "App Store Server API",
  description:
    "Manage App Store in-app purchase transactions, subscriptions, refunds, server notifications, and retention messaging.",
  categories: ["Developer Tools", "Finance"],
  authTypes: ["custom_credential"],
  auth: [
    {
      type: "custom_credential",
      fields: [
        {
          key: "issuerId",
          label: "Issuer ID",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "57246542-96fe-1a63-e053-0824d011072a",
          description: "The issuer ID shown above the In-App Purchase key list in App Store Connect.",
        },
        {
          key: "keyId",
          label: "Key ID",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "2X9R4HXF34",
          description: "The identifier shown next to the In-App Purchase key in App Store Connect.",
        },
        {
          key: "privateKey",
          label: "Private Key (.p8)",
          inputType: "textarea",
          required: true,
          secret: true,
          placeholder: "-----BEGIN PRIVATE KEY-----",
          description:
            "The complete SubscriptionKey_<KEYID>.p8 contents. Use an In-App Purchase key, not an App Store Connect API key. Escaped \\n line breaks are accepted.",
        },
        {
          key: "bundleId",
          label: "Bundle ID",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "com.example.myapp",
          description: "The bundle identifier of the app this connection acts on.",
        },
        {
          key: "environment",
          label: "Environment",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "production",
          description: "The App Store server environment: production or sandbox.",
        },
      ],
    },
  ],
  homepageUrl: "https://developer.apple.com/documentation/appstoreserverapi",
  actions: appStoreServerActions,
};
