import type { ProviderDefinition } from "../../core/types.ts";

import { appleMapsActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "apple_maps",
  displayName: "Apple Maps",
  description: "Geocode addresses, search places, calculate directions, and estimate travel times with Apple Maps.",
  categories: ["Location", "Developer Tools"],
  authTypes: ["custom_credential"],
  auth: [
    {
      type: "custom_credential",
      fields: [
        { key: "teamId", label: "Team ID", inputType: "text", required: true, secret: false },
        { key: "keyId", label: "Key ID", inputType: "text", required: true, secret: false },
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
  homepageUrl: "https://developer.apple.com/maps/",
  actions: appleMapsActions,
};
