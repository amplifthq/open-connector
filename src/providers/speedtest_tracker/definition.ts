import type { ProviderDefinition } from "../../core/types.ts";

import { speedtestTrackerActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "speedtest_tracker",
  displayName: "Speedtest Tracker",
  description:
    "Run speed tests and inspect results, statistics, and Ookla servers on a self-hosted Speedtest Tracker instance.",
  categories: ["Developer Tools", "Analytics"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Token",
      placeholder: "Enter your Speedtest Tracker API token",
      description:
        "A bearer token created from /admin/api-tokens on your Speedtest Tracker instance. See https://docs.speedtest-tracker.dev/api/authorization.",
      extraFields: [
        {
          key: "baseUrl",
          label: "Instance URL",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "https://speedtest.example.com",
          description:
            "The HTTPS root URL of your Speedtest Tracker instance, including any reverse-proxy subpath. Private-network instances require OOMOL_CONNECT_ALLOW_PRIVATE_NETWORK in a self-hosted Node deployment.",
        },
      ],
    },
  ],
  homepageUrl: "https://speedtest-tracker.dev",
  actions: speedtestTrackerActions,
};
