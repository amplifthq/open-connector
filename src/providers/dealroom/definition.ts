import type { ProviderDefinition } from "../../core/types.ts";

import { dealroomActions } from "./actions.ts";
export const provider: ProviderDefinition = {
  service: "dealroom",
  displayName: "Dealroom",
  categories: ["Data", "Marketing"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "DEALROOM_API_KEY",
      description:
        "Dealroom Premium API key used as the HTTP Basic username with an empty password. Obtain API access from https://docs.dealroom.co/docs/premium-api.",
    },
  ],
  homepageUrl: "https://dealroom.co",
  actions: dealroomActions,
};
