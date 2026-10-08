import type { ProviderDefinition } from "../../core/types.ts";

import { toriiImageTranslatorActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "torii_image_translator",
  displayName: "Torii Image Translator",
  categories: ["Artificial Intelligence", "Productivity"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "TORII_API_KEY",
      description:
        "Torii API key used to translate and typeset images. Create or copy it from your Torii account at https://toriitranslate.com.",
    },
  ],
  homepageUrl: "https://toriitranslate.com",
  actions: toriiImageTranslatorActions,
};
