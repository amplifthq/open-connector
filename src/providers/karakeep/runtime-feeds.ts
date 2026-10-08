import type { KarakeepHandlerMap } from "./runtime-helpers.ts";

import { optionalString, compactObject } from "../../core/cast.ts";
import { requiredResponseRecord } from "../provider-runtime.ts";
import { encodeKarakeepId, requireKarakeepUpdateFields } from "./runtime-helpers.ts";

function readFeedTarget(input: Record<string, unknown>) {
  const feedId = optionalString(input.feedId) ?? "";
  return { feedId, path: `/feeds/${encodeKarakeepId(feedId, "feedId")}` };
}

export const karakeepFeedActionHandlers: KarakeepHandlerMap = {
  async list_feeds(_input, context) {
    return requiredResponseRecord(await context.request({ method: "GET", path: "/feeds" }), "the feed list");
  },
  async create_feed(input, context) {
    return requiredResponseRecord(
      await context.request({
        method: "POST",
        path: "/feeds",
        body: compactObject({
          name: input.name,
          url: input.url,
          enabled: input.enabled,
          importTags: input.importTags,
        }),
      }),
      "the created feed",
    );
  },
  async get_feed(input, context) {
    const target = readFeedTarget(input);
    return requiredResponseRecord(await context.request({ method: "GET", path: target.path }), "the feed");
  },
  async update_feed(input, context) {
    const target = readFeedTarget(input);
    return requiredResponseRecord(
      await context.request({
        method: "PATCH",
        path: target.path,
        body: requireKarakeepUpdateFields(
          compactObject({
            name: input.name,
            url: input.url,
            enabled: input.enabled,
            importTags: input.importTags,
          }),
        ),
      }),
      "the updated feed",
    );
  },
  async delete_feed(input, context) {
    const target = readFeedTarget(input);
    await context.request({ method: "DELETE", path: target.path, expectJson: false });
    return { success: true, feedId: target.feedId };
  },
  async fetch_feed_now(input, context) {
    const target = readFeedTarget(input);
    await context.request({ method: "POST", path: `${target.path}/fetch`, expectJson: false });
    return { success: true, feedId: target.feedId };
  },
};
