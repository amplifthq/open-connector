import type { KarakeepExecutionContext, KarakeepHandlerMap } from "./runtime-helpers.ts";

import {
  nullableString,
  optionalInteger,
  optionalRawString,
  optionalRecord,
  optionalString,
  optionalBoolean,
  requiredString,
  stringArray,
} from "../../core/cast.ts";
import {
  providerInputError,
  providerResponseError,
  requiredInputString,
  requiredResponseRecord,
} from "../provider-runtime.ts";
import { encodeKarakeepId, pickProvidedFields } from "./runtime-helpers.ts";

const summarizeTimeoutMs = 120_000;

const updatableBookmarkFields = [
  "archived",
  "favourited",
  "summary",
  "note",
  "title",
  "createdAt",
  "url",
  "description",
  "author",
  "publisher",
  "datePublished",
  "dateModified",
  "text",
  "assetContent",
] as const;

const createBookmarkCommonFields = [
  "title",
  "archived",
  "favourited",
  "note",
  "summary",
  "createdAt",
  "crawlPriority",
  "source",
] as const;

function requireVariantField(input: Record<string, unknown>, field: string, type: string, allowEmpty = false) {
  const value = allowEmpty ? optionalRawString(input[field]) : optionalString(input[field]);
  if (value === undefined) {
    throw providerInputError(`${field} is required when type is ${type}`);
  }
}

function buildCreateBookmarkBody(input: Record<string, unknown>): Record<string, unknown> {
  const type = requiredInputString(input.type, "type");
  let variantFields: readonly string[];
  if (type === "link") {
    requireVariantField(input, "url", type);
    variantFields = ["url", "precrawledArchiveId"];
  } else if (type === "text") {
    requireVariantField(input, "text", type, true);
    variantFields = ["text", "sourceUrl"];
  } else {
    requireVariantField(input, "assetType", type);
    requireVariantField(input, "assetId", type);
    variantFields = ["assetType", "assetId", "fileName", "sourceUrl"];
  }
  return {
    type,
    ...pickProvidedFields(input, variantFields),
    ...pickProvidedFields(input, createBookmarkCommonFields),
  };
}

function buildManipulatedTags(value: unknown): Record<string, unknown>[] {
  const tags = Array.isArray(value) ? value : [];
  return tags.map((tag, index) => {
    const record = optionalRecord(tag) ?? {};
    const tagId = optionalString(record.tagId)?.trim();
    const tagName = optionalString(record.tagName)?.trim();
    if (!tagId && !tagName) {
      throw providerInputError(`tags[${index}] must provide either tagId or tagName`);
    }
    return pickProvidedFields(record, ["tagId", "tagName", "attachedBy"]);
  });
}

function normalizePaginatedBookmarks(value: unknown): Record<string, unknown> {
  const page = requiredResponseRecord(value, "the bookmark page");
  return {
    ...page,
    bookmarks: Array.isArray(page.bookmarks) ? page.bookmarks : [],
    nextCursor: nullableString(page.nextCursor) ?? null,
  };
}

function bookmarkPath(input: Record<string, unknown>, suffix = ""): string {
  return `/bookmarks/${encodeKarakeepId(input.bookmarkId, "bookmarkId")}${suffix}`;
}

async function requestTagManipulation(
  context: KarakeepExecutionContext,
  input: Record<string, unknown>,
  method: "POST" | "DELETE",
  field: "attached" | "detached",
) {
  const response = requiredResponseRecord(
    await context.request({
      method,
      path: bookmarkPath(input, "/tags"),
      body: { tags: buildManipulatedTags(input.tags) },
    }),
    `the ${field} tags`,
  );
  return { [field]: stringArray(response[field] ?? [], field) };
}

export const karakeepBookmarkActionHandlers: KarakeepHandlerMap = {
  async list_bookmarks(input, context) {
    return normalizePaginatedBookmarks(
      await context.request({
        method: "GET",
        path: "/bookmarks",
        query: {
          archived: optionalBoolean(input.archived),
          favourited: optionalBoolean(input.favourited),
          sortOrder: optionalString(input.sortOrder),
          limit: optionalInteger(input.limit),
          cursor: optionalString(input.cursor),
          includeContent: optionalBoolean(input.includeContent),
        },
      }),
    );
  },
  async create_bookmark(input, context) {
    const bookmark = requiredResponseRecord(
      await context.request({
        method: "POST",
        path: "/bookmarks",
        body: buildCreateBookmarkBody(input),
      }),
      "the created bookmark",
    );
    return { ...bookmark, alreadyExists: bookmark.alreadyExists === true };
  },
  async search_bookmarks(input, context) {
    return normalizePaginatedBookmarks(
      await context.request({
        method: "GET",
        path: "/bookmarks/search",
        query: {
          q: requiredInputString(input.q, "q"),
          searchMode: optionalString(input.searchMode),
          sortOrder: optionalString(input.sortOrder),
          limit: optionalInteger(input.limit),
          cursor: optionalString(input.cursor),
          includeContent: optionalBoolean(input.includeContent),
        },
      }),
    );
  },
  async check_bookmark_url(input, context) {
    const result = requiredResponseRecord(
      await context.request({
        method: "GET",
        path: "/bookmarks/check-url",
        query: { url: requiredInputString(input.url, "url") },
      }),
      "the check-url result",
    );
    return { bookmarkId: nullableString(result.bookmarkId) ?? null };
  },
  async get_bookmark(input, context) {
    return requiredResponseRecord(
      await context.request({
        method: "GET",
        path: bookmarkPath(input),
        query: { includeContent: optionalBoolean(input.includeContent) },
      }),
      "the bookmark",
    );
  },
  async update_bookmark(input, context) {
    return requiredResponseRecord(
      await context.request({
        method: "PATCH",
        path: bookmarkPath(input),
        body: pickProvidedFields(input, updatableBookmarkFields),
      }),
      "the updated bookmark",
    );
  },
  async delete_bookmark(input, context) {
    await context.request({
      method: "DELETE",
      path: bookmarkPath(input),
      expectJson: false,
    });
    return {
      success: true,
      bookmarkId: requiredInputString(input.bookmarkId, "bookmarkId"),
    };
  },
  async get_bookmark_content(input, context) {
    const chunk = requiredResponseRecord(
      await context.request({
        method: "GET",
        path: bookmarkPath(input, "/content"),
        query: {
          format: optionalString(input.format),
          maxChars: optionalInteger(input.maxChars),
          cursor: optionalString(input.cursor),
        },
      }),
      "the readable content",
    );
    return { ...chunk, nextCursor: nullableString(chunk.nextCursor) ?? null };
  },
  async summarize_bookmark(input, context) {
    const result = requiredResponseRecord(
      await context.request({
        method: "POST",
        path: bookmarkPath(input, "/summarize"),
        timeoutMs: summarizeTimeoutMs,
      }),
      "the generated summary",
    );
    const summarizationStatus =
      "summarizationStatus" in result ? (optionalString(result.summarizationStatus)?.trim() ?? null) : undefined;
    if (typeof result.summary === "string") {
      return { summary: result.summary, summarizationStatus };
    }
    const looksLikeBookmark =
      typeof result.id === "string" && (summarizationStatus !== undefined || "summary" in result);
    if (looksLikeBookmark) {
      return { summary: null, summarizationStatus };
    }
    return {
      summary: requiredString(result.summary, "the generated summary", providerResponseError),
      summarizationStatus,
    };
  },
  async attach_tags_to_bookmark(input, context) {
    return requestTagManipulation(context, input, "POST", "attached");
  },
  async detach_tags_from_bookmark(input, context) {
    return requestTagManipulation(context, input, "DELETE", "detached");
  },
  async get_bookmark_lists(input, context) {
    const response = requiredResponseRecord(
      await context.request({ method: "GET", path: bookmarkPath(input, "/lists") }),
      "the bookmark lists",
    );
    return { ...response, lists: Array.isArray(response.lists) ? response.lists : [] };
  },
  async get_bookmark_highlights(input, context) {
    const response = requiredResponseRecord(
      await context.request({ method: "GET", path: bookmarkPath(input, "/highlights") }),
      "the bookmark highlights",
    );
    return {
      ...response,
      highlights: Array.isArray(response.highlights) ? response.highlights : [],
    };
  },
  async attach_asset_to_bookmark(input, context) {
    return requiredResponseRecord(
      await context.request({
        method: "POST",
        path: bookmarkPath(input, "/assets"),
        body: {
          id: requiredInputString(input.assetId, "assetId"),
          assetType: requiredInputString(input.assetType, "assetType"),
        },
      }),
      "the attached asset",
    );
  },
  async replace_asset_on_bookmark(input, context) {
    const assetId = requiredInputString(input.assetId, "assetId");
    const newAssetId = requiredInputString(input.newAssetId, "newAssetId");
    if (assetId === newAssetId) {
      throw providerInputError("newAssetId must be different from assetId");
    }
    await context.request({
      method: "PUT",
      path: bookmarkPath(input, `/assets/${encodeKarakeepId(assetId, "assetId")}`),
      body: { assetId: newAssetId },
      expectJson: false,
    });
    return {
      success: true,
      bookmarkId: requiredInputString(input.bookmarkId, "bookmarkId"),
      assetId,
      newAssetId,
    };
  },
  async detach_asset_from_bookmark(input, context) {
    const assetId = requiredInputString(input.assetId, "assetId");
    await context.request({
      method: "DELETE",
      path: bookmarkPath(input, `/assets/${encodeKarakeepId(assetId, "assetId")}`),
      expectJson: false,
    });
    return {
      success: true,
      bookmarkId: requiredInputString(input.bookmarkId, "bookmarkId"),
      assetId,
    };
  },
};
