import type { ProviderDefinition } from "../../core/types.ts";

import { newscatcherActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "newscatcher",
  displayName: "NewsCatcher",
  categories: ["Data & Analytics"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "YOUR_NEWSCATCHER_API_KEY",
      description:
        "NewsCatcher News API key sent with the x-api-token header. Request trial access or contact NewsCatcher from https://www.newscatcherapi.com/news-api.",
    },
  ],
  homepageUrl: "https://www.newscatcherapi.com/",
  actions: newscatcherActions,
};
