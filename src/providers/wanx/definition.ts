import type { ProviderDefinition } from "../../core/types.ts";

import { wanxActions } from "./actions.ts";

const service = "wanx";

export const provider: ProviderDefinition = {
  service,
  displayName: "Wanx",
  categories: ["AI", "Design & Media"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "Model Studio API Key",
      placeholder: "Your Beijing Model Studio API key",
      description:
        "Beijing Model Studio API key sent as a Bearer token. Create one at https://bailian.console.aliyun.com/?apiKey=1#/api-key.",
    },
  ],
  homepageUrl: "https://tongyi.aliyun.com/wanxiang/",
  actions: wanxActions,
};
