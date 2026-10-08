import type { ProviderDefinition } from "../../core/types.ts";

import { appleNotaryActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "apple_notary",
  displayName: "Apple Notary",
  description: "Submit macOS software to Apple's Notary API and inspect notarization results.",
  categories: ["Developer Tools", "Security"],
  authTypes: ["custom_credential"],
  auth: [
    {
      type: "custom_credential",
      fields: [
        {
          key: "keyId",
          label: "Key ID",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "2X9R4HXF34",
          description: "The App Store Connect API key identifier.",
        },
        {
          key: "issuerId",
          label: "Issuer ID",
          inputType: "text",
          required: false,
          secret: false,
          placeholder: "57246542-96fe-1a63-e053-0824d011072a",
          description: "The issuer ID for a team key. Leave empty for an individual key.",
        },
        {
          key: "privateKey",
          label: "Private Key (.p8)",
          inputType: "textarea",
          required: true,
          secret: true,
          placeholder: "-----BEGIN PRIVATE KEY-----",
          description: "The complete PKCS#8 PEM private key used locally to sign short-lived ES256 tokens.",
        },
      ],
    },
  ],
  homepageUrl: "https://developer.apple.com/documentation/notaryapi",
  actions: appleNotaryActions,
};
