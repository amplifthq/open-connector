import type { ProviderDefinition } from "../../core/types.ts";

import { aliyunAckActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "aliyun_ack",
  displayName: "Alibaba Cloud ACK",
  categories: ["Developer Tools", "Security"],
  authTypes: ["custom_credential"],
  auth: [
    {
      type: "custom_credential",
      fields: [
        {
          key: "accessKeyId",
          label: "Access Key ID",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "LTAI...",
          description:
            "Alibaba Cloud RAM AccessKey ID used to call ACK. Create or manage AccessKey pairs here: https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair",
        },
        {
          key: "accessKeySecret",
          label: "Access Key Secret",
          inputType: "password",
          required: true,
          secret: true,
          placeholder: "Your AccessKey secret",
          description:
            "Alibaba Cloud RAM AccessKey secret from the same pair. Alibaba Cloud shows it only when the key pair is created: https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair",
        },
      ],
    },
  ],
  homepageUrl: "https://www.alibabacloud.com/product/kubernetes",
  actions: aliyunAckActions,
};
