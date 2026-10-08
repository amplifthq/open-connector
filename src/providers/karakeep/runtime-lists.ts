import type { KarakeepHandlerMap } from "./runtime-helpers.ts";

import { nullableString, optionalInteger, optionalString, compactObject, optionalBoolean } from "../../core/cast.ts";
import { providerInputError, requiredResponseRecord } from "../provider-runtime.ts";
import { encodeKarakeepId, requireKarakeepUpdateFields } from "./runtime-helpers.ts";

export const karakeepListActionHandlers: KarakeepHandlerMap = {
  async list_lists(_input, context) {
    return requiredResponseRecord(await context.request({ method: "GET", path: "/lists" }), "the list collection");
  },
  async create_list(input, context) {
    const type = optionalString(input.type) ?? "manual";
    const query = optionalString(input.query)?.trim();
    if (type === "smart" && !query) {
      throw providerInputError("A smart list requires a query");
    }
    if (type === "manual" && query) {
      throw providerInputError("A manual list cannot have a query");
    }
    const body = compactObject({
      name: input.name,
      description: input.description,
      icon: input.icon,
      type,
      query,
      parentId: input.parentId,
    });
    return requiredResponseRecord(await context.request({ method: "POST", path: "/lists", body }), "the created list");
  },
  async get_list(input, context) {
    return requiredResponseRecord(
      await context.request({
        method: "GET",
        path: `/lists/${encodeKarakeepId(input.listId, "listId")}`,
      }),
      "the list",
    );
  },
  async update_list(input, context) {
    const body = requireKarakeepUpdateFields(
      compactObject({
        name: input.name,
        description: input.description,
        icon: input.icon,
        parentId: input.parentId,
        query: input.query,
        public: input.public,
      }),
    );
    return requiredResponseRecord(
      await context.request({
        method: "PATCH",
        path: `/lists/${encodeKarakeepId(input.listId, "listId")}`,
        body,
      }),
      "the updated list",
    );
  },
  async delete_list(input, context) {
    const listId = String(input.listId);
    await context.request({
      method: "DELETE",
      path: `/lists/${encodeKarakeepId(listId, "listId")}`,
      expectJson: false,
    });
    return { success: true, listId };
  },
  async get_list_bookmarks(input, context) {
    const page = requiredResponseRecord(
      await context.request({
        method: "GET",
        path: `/lists/${encodeKarakeepId(input.listId, "listId")}/bookmarks`,
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
  async add_bookmark_to_list(input, context) {
    const listId = String(input.listId);
    const bookmarkId = String(input.bookmarkId);
    await context.request({
      method: "PUT",
      path: `/lists/${encodeKarakeepId(listId, "listId")}/bookmarks/${encodeKarakeepId(bookmarkId, "bookmarkId")}`,
      expectJson: false,
    });
    return { success: true, listId, bookmarkId };
  },
  async remove_bookmark_from_list(input, context) {
    const listId = String(input.listId);
    const bookmarkId = String(input.bookmarkId);
    await context.request({
      method: "DELETE",
      path: `/lists/${encodeKarakeepId(listId, "listId")}/bookmarks/${encodeKarakeepId(bookmarkId, "bookmarkId")}`,
      expectJson: false,
    });
    return { success: true, listId, bookmarkId };
  },
};
