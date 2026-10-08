import type { KarakeepHandlerMap } from "./runtime-helpers.ts";

import { nullableString, optionalInteger, optionalString, compactObject, optionalBoolean } from "../../core/cast.ts";
import { providerInputError, requiredResponseRecord } from "../provider-runtime.ts";
import { encodeKarakeepId, requireKarakeepUpdateFields } from "./runtime-helpers.ts";

export const karakeepTagActionHandlers: KarakeepHandlerMap = {
  async list_tags(input, context) {
    const sort = optionalString(input.sort);
    const nameContains = optionalString(input.nameContains);
    if (sort === "relevance" && !nameContains) {
      throw providerInputError("Relevance sorting requires a nameContains filter");
    }
    const cursor = optionalString(input.cursor);
    const limit = optionalInteger(input.limit);
    if (cursor !== undefined && limit === undefined) {
      throw providerInputError("list_tags cursor requires the same limit that produced it");
    }
    const page = requiredResponseRecord(
      await context.request({
        method: "GET",
        path: "/tags",
        query: {
          nameContains,
          sort,
          attachedBy: optionalString(input.attachedBy),
          cursor,
          limit,
        },
      }),
      "the tag page",
    );
    return { ...page, nextCursor: nullableString(page.nextCursor) ?? null };
  },
  async create_tag(input, context) {
    return requiredResponseRecord(
      await context.request({ method: "POST", path: "/tags", body: { name: input.name } }),
      "the created tag",
    );
  },
  async get_tag(input, context) {
    return requiredResponseRecord(
      await context.request({
        method: "GET",
        path: `/tags/${encodeKarakeepId(input.tagId, "tagId")}`,
      }),
      "the tag",
    );
  },
  async update_tag(input, context) {
    return requiredResponseRecord(
      await context.request({
        method: "PATCH",
        path: `/tags/${encodeKarakeepId(input.tagId, "tagId")}`,
        body: requireKarakeepUpdateFields(compactObject({ name: input.name })),
      }),
      "the updated tag",
    );
  },
  async delete_tag(input, context) {
    const tagId = String(input.tagId);
    await context.request({
      method: "DELETE",
      path: `/tags/${encodeKarakeepId(tagId, "tagId")}`,
      expectJson: false,
    });
    return { success: true, tagId };
  },
  async get_tag_bookmarks(input, context) {
    const page = requiredResponseRecord(
      await context.request({
        method: "GET",
        path: `/tags/${encodeKarakeepId(input.tagId, "tagId")}/bookmarks`,
        query: {
          sortOrder: optionalString(input.sortOrder),
          limit: optionalInteger(input.limit),
          cursor: optionalString(input.cursor),
          includeContent: optionalBoolean(input.includeContent),
        },
      }),
      "the bookmark page",
    );
    return { ...page, nextCursor: nullableString(page.nextCursor) ?? null };
  },
};
