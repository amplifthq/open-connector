import type { ProviderDefinition } from "../../core/types.ts";

import { imagetranslateAiActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "imagetranslate_ai",
  displayName: "ImageTranslate.AI",
  categories: ["Artificial Intelligence", "Productivity"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "IMAGETRANSLATE_AI_API_KEY",
      description:
        "ImageTranslate.AI API key used for translation requests. Create or copy it from your ImageTranslate.AI account at https://imagetranslate.ai.",
    },
  ],
  homepageUrl: "https://imagetranslate.ai",
  actions: imagetranslateAiActions,
};
