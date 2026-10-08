import type { ProviderDefinition } from "../../core/types.ts";

import { descriptActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "descript",
  displayName: "Descript",
  categories: ["AI", "Design & Media"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Token",
      placeholder: "DESCRIPT_API_TOKEN",
      description:
        "Personal API token sent as a Bearer credential. Create a Drive-scoped token in Descript Settings under API tokens: https://docs.descriptapi.com/#section/Getting-started/Create-an-API-token",
    },
  ],
  homepageUrl: "https://www.descript.com/",
  actions: descriptActions,
};
