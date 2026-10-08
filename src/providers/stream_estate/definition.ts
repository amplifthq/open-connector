import type { ProviderDefinition } from "../../core/types.ts";

import { streamEstateActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "stream_estate",
  displayName: "Stream Estate",
  categories: ["Data", "Location"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "STREAM_ESTATE_API_KEY",
      description:
        "Stream Estate API key sent with the X-API-KEY header. Sign up and create a key in your account settings: https://stream.estate/signup.",
    },
  ],
  homepageUrl: "https://stream.estate",
  actions: streamEstateActions,
};
