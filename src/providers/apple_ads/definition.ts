import type { ProviderDefinition } from "../../core/types.ts";

import { appleAdsActions } from "./actions.ts";

const apiSettingsDocUrl =
  "https://developer.apple.com/documentation/apple-ads-platform-api/implementing-oauth-for-the-apple-ads-platform-api";

export const provider: ProviderDefinition = {
  service: "apple_ads",
  displayName: "Apple Ads",
  description:
    "Manage Apple Ads accounts, campaigns, targeting, creatives, reports, insights, and change history through the Apple Ads Platform API.",
  categories: ["Marketing", "Data"],
  authTypes: ["custom_credential"],
  auth: [
    {
      type: "custom_credential",
      fields: [
        {
          key: "clientId",
          label: "Client ID",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "SEARCHADS.aeb3ef5f-0c5a-4f2a-99c8-fca83f25a9",
          description: `The clientId shown after saving a public key under Apple Ads Account Settings > API. ${apiSettingsDocUrl}`,
        },
        {
          key: "teamId",
          label: "Team ID",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "SEARCHADS.hgw3ef3p-0w7a-8a2n-77c8-scv83f25a7",
          description: `The teamId shown under Apple Ads Account Settings > API. ${apiSettingsDocUrl}`,
        },
        {
          key: "keyId",
          label: "Key ID",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "a273d0d3-4d9e-458c-a173-0db8619ca7d7",
          description: `The keyId assigned to the public key uploaded under Apple Ads Account Settings > API. ${apiSettingsDocUrl}`,
        },
        {
          key: "privateKey",
          label: "Private Key (PEM)",
          inputType: "textarea",
          required: true,
          secret: true,
          placeholder: "-----BEGIN EC PRIVATE KEY-----",
          description:
            "The EC P-256 private key paired with the public key uploaded to Apple Ads. SEC1 and PKCS#8 PEM are accepted, including escaped \\n line breaks.",
        },
        {
          key: "adAccountId",
          label: "Ad Account ID",
          inputType: "text",
          required: false,
          secret: false,
          placeholder: "123456789",
          description:
            "Optional default ad account sent as X-AP-Context. Leave empty to pass adAccountId to each scoped action.",
        },
      ],
      testAction: { actionName: "get_me", input: {} },
    },
  ],
  homepageUrl: "https://ads.apple.com/",
  actions: appleAdsActions,
};
