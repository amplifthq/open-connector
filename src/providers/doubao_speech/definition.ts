import type { ProviderDefinition } from "../../core/types.ts";

import { doubaoSpeechActions } from "./actions.ts";

const service = "doubao_speech";

export const provider: ProviderDefinition = {
  service,
  displayName: "Doubao Speech",
  categories: ["AI", "Communication"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "Doubao Speech APP Key",
      placeholder: "Your Doubao Speech APP Key",
      description:
        "APP Key from the Doubao Speech console, sent only in the X-Api-Key header. Keys from the Ark console are not supported.",
    },
  ],
  homepageUrl: "https://www.volcengine.com/product/doubao-voice",
  actions: doubaoSpeechActions,
};
