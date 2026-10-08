import type { ProviderDefinition } from "../../core/types.ts";

import { btMcpActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "bt_mcp",
  displayName: "BT Panel MCP",
  description: "Operate a BT Panel instance through its installed MCP endpoint.",
  categories: ["Infrastructure", "Developer Tools"],
  authTypes: ["custom_credential"],
  auth: [
    {
      type: "custom_credential",
      fields: [
        {
          key: "serverUrl",
          label: "MCP Server URL",
          inputType: "text",
          required: true,
          secret: true,
          placeholder: "https://203.0.113.10:8765/bt-mcp-instance/mcp",
          description:
            "Full MCP endpoint created by the BT Panel MCP plugin. Find it in BT Panel after installing and configuring the MCP service: https://docs.bt.cn/ai-ops/mcp/installation.",
        },
        {
          key: "authorizationToken",
          label: "Authorization Token",
          inputType: "password",
          required: true,
          secret: true,
          placeholder: "Paste your BT Panel MCP authorization token",
          description:
            "Bearer token copied with the MCP Server URL from BT Panel MCP Service > Security Authorization.",
        },
      ],
    },
  ],
  homepageUrl: "https://www.bt.cn",
  actions: btMcpActions,
};
