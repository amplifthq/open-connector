import type { KarakeepHandlerMap } from "./runtime-helpers.ts";

import { optionalString, compactObject } from "../../core/cast.ts";
import { requiredResponseRecord } from "../provider-runtime.ts";
import { encodeKarakeepId, requireKarakeepUpdateFields } from "./runtime-helpers.ts";

export const karakeepAdminActionHandlers: KarakeepHandlerMap = {
  async admin_update_user(input, context) {
    const userId = optionalString(input.userId) ?? "";
    const update = requireKarakeepUpdateFields(
      compactObject({
        role: input.role,
        bookmarkQuota: input.bookmarkQuota,
        storageQuota: input.storageQuota,
        browserCrawlingEnabled: input.browserCrawlingEnabled,
      }),
    );
    return requiredResponseRecord(
      await context.request({
        method: "PUT",
        path: `/admin/users/${encodeKarakeepId(userId, "userId")}`,
        body: {
          userId,
          ...update,
        },
      }),
      "the user update result",
    );
  },
  async admin_trigger_recrawl(input, context) {
    return requiredResponseRecord(
      await context.request({
        method: "POST",
        path: "/admin/jobs/trigger/recrawl",
        body: compactObject({
          crawlStatus: input.crawlStatus,
          runInference: input.runInference,
          modifiedWithinSeconds: input.modifiedWithinSeconds,
        }),
      }),
      "the recrawl trigger result",
    );
  },
  async admin_trigger_reindex(input, context) {
    return requiredResponseRecord(
      await context.request({
        method: "POST",
        path: "/admin/jobs/trigger/reindex",
        body: compactObject({ modifiedWithinSeconds: input.modifiedWithinSeconds }),
      }),
      "the reindex trigger result",
    );
  },
  async admin_trigger_inference(input, context) {
    return requiredResponseRecord(
      await context.request({
        method: "POST",
        path: "/admin/jobs/trigger/inference",
        body: compactObject({
          type: input.type,
          status: input.status,
          modifiedWithinSeconds: input.modifiedWithinSeconds,
        }),
      }),
      "the inference trigger result",
    );
  },
};
