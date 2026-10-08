import type { KarakeepHandlerMap } from "./runtime-helpers.ts";

import { nullableString, optionalInteger, optionalString, compactObject } from "../../core/cast.ts";
import { requiredResponseRecord } from "../provider-runtime.ts";
import { encodeKarakeepId, requireKarakeepUpdateFields } from "./runtime-helpers.ts";

export const karakeepHighlightActionHandlers: KarakeepHandlerMap = {
  async list_highlights(input, context) {
    const page = requiredResponseRecord(
      await context.request({
        method: "GET",
        path: "/highlights",
        query: {
          limit: optionalInteger(input.limit),
          cursor: optionalString(input.cursor),
        },
      }),
      "the highlight page",
    );
    return { ...page, nextCursor: nullableString(page.nextCursor) ?? null };
  },
  async create_highlight(input, context) {
    const body = {
      bookmarkId: input.bookmarkId,
      startOffset: input.startOffset,
      endOffset: input.endOffset,
      color: optionalString(input.color) ?? "yellow",
      text: input.text ?? null,
      note: input.note ?? null,
    };
    return requiredResponseRecord(
      await context.request({ method: "POST", path: "/highlights", body }),
      "the created highlight",
    );
  },
  async get_highlight(input, context) {
    return requiredResponseRecord(
      await context.request({
        method: "GET",
        path: `/highlights/${encodeKarakeepId(input.highlightId, "highlightId")}`,
      }),
      "the highlight",
    );
  },
  async update_highlight(input, context) {
    const body = requireKarakeepUpdateFields(compactObject({ color: input.color, note: input.note }));
    return requiredResponseRecord(
      await context.request({
        method: "PATCH",
        path: `/highlights/${encodeKarakeepId(input.highlightId, "highlightId")}`,
        body,
      }),
      "the updated highlight",
    );
  },
  async delete_highlight(input, context) {
    return requiredResponseRecord(
      await context.request({
        method: "DELETE",
        path: `/highlights/${encodeKarakeepId(input.highlightId, "highlightId")}`,
      }),
      "the deleted highlight",
    );
  },
};
