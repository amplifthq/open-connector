import type { JsonSchema } from "../../core/types.ts";

import { readSchemaProperties, readSchemaRequired, s } from "../../core/json-schema.ts";

function extendObjectSchema(
  description: string,
  base: JsonSchema,
  properties: Record<string, JsonSchema>,
  options: { optional?: readonly string[] } = {},
): JsonSchema {
  const optional = new Set(options.optional ?? []);
  const required = [...readSchemaRequired(base), ...Object.keys(properties).filter((name) => !optional.has(name))];
  return {
    ...base,
    description,
    properties: { ...readSchemaProperties(base), ...properties },
    required: [...new Set(required)],
  };
}

export const emptyInputSchema: JsonSchema = s.object("The input payload for this action.", {});

export const karakeepIdField = (description: string): JsonSchema => s.nonEmptyString(description);

const cursorField: JsonSchema = s.nonEmptyString(
  "Opaque pagination cursor returned as nextCursor by a previous response of the same endpoint. Cursor formats differ per endpoint and must never be reused across endpoints.",
);

export function cursorFieldFor(sourceActionName: string, note?: string): JsonSchema {
  const description = `Opaque pagination cursor. Pass the nextCursor returned by a previous ${sourceActionName} response; cursor formats differ per Karakeep endpoint, so cursors from other endpoints are rejected.`;
  return s.describe(cursorField, note ? `${description} ${note}` : description);
}

export const limitField: JsonSchema = s.integer(
  "Maximum number of items to return in one page, between 1 and 100. Defaults to 20.",
  { minimum: 1, maximum: 100 },
);

export const tagLimitField: JsonSchema = s.integer(
  "Maximum number of tags to return in one page, between 1 and 1000. Pagination is only active when limit is given: omit it and Karakeep returns every tag with no cursor, and the same limit has to be repeated on every page.",
  { minimum: 1, maximum: 1000 },
);

export function successResultSchema(
  description: string,
  successDescription: string,
  idDescriptions: Record<string, string>,
): JsonSchema {
  const properties: Record<string, JsonSchema> = {
    success: s.boolean(successDescription),
  };
  for (const [name, idDescription] of Object.entries(idDescriptions)) {
    properties[name] = s.string(idDescription);
  }
  return s.requiredObject(description, properties);
}

export const transitFileFields: Record<string, JsonSchema> = {
  fileId: s.nonEmptyString("The local transit file identifier."),
  downloadUrl: s.url("The local URL used to download the temporary file."),
  name: s.nonEmptyString("The stored file name."),
  mimeType: s.nonEmptyString("The stored MIME type."),
  sizeBytes: s.nonNegativeInteger("The number of bytes stored in the transit file."),
};

export const sortOrderField: JsonSchema = s.stringEnum("Sort direction by bookmark creation date.", ["asc", "desc"]);

export const includeContentField: JsonSchema = s.boolean(
  "Whether to include the large extracted content fields on returned bookmarks. Defaults to false because the payload can be very large.",
);

const nextCursorField: JsonSchema = s.nullable(
  s.string("Opaque cursor for the next page, or null when there are no more items."),
);

const bookmarkJobStatusValues = ["success", "failure", "pending"] as const;

export const bookmarkSourceValues = [
  "api",
  "web",
  "cli",
  "mobile",
  "extension",
  "singlefile",
  "rss",
  "import",
] as const;

export const attachableAssetTypeValues = [
  "screenshot",
  "pdf",
  "assetScreenshot",
  "precrawledArchive",
  "bannerImage",
  "video",
  "userUploaded",
] as const;

const bookmarkAssetTypeValues = [
  "linkHtmlContent",
  "screenshot",
  "pdf",
  "assetScreenshot",
  "bannerImage",
  "fullPageArchive",
  "video",
  "bookmarkAsset",
  "precrawledArchive",
  "userUploaded",
  "avatar",
  "unknown",
] as const;

function jobStatusField(description: string): JsonSchema {
  return s.nullable(s.stringEnum(description, bookmarkJobStatusValues));
}

const bookmarkTagSchema: JsonSchema = s.looseRequiredObject("A tag attached to a bookmark.", {
  id: s.string("The tag id."),
  name: s.string("The tag name."),
  attachedBy: s.stringEnum("Whether the tag was attached by a human or by AI tagging.", ["ai", "human"]),
});

export const bookmarkAssetRefSchema: JsonSchema = s.looseRequiredObject(
  "An asset attached to a bookmark.",
  {
    id: s.string("The asset id."),
    assetType: s.stringEnum("The role the asset plays for the bookmark.", bookmarkAssetTypeValues),
    fileName: s.nullableString("The original file name, or null when Karakeep has none."),
  },
  { optional: ["fileName"] },
);

const bookmarkContentSchema: JsonSchema = s.object(
  "The bookmark content. The type field discriminates link, text, asset and unknown bookmarks, and only the fields that belong to that variant are present.",
  {
    type: s.string("The content variant: link, text, asset, or unknown."),
    url: s.string("The bookmarked URL, for link bookmarks."),
    title: s.nullableString("The crawled page title, or null."),
    description: s.nullableString("The crawled page description, or null."),
    imageUrl: s.nullableString("The crawled preview image URL, or null."),
    imageAssetId: s.nullableString("The stored preview image asset id, or null."),
    screenshotAssetId: s.nullableString("The stored screenshot asset id, or null."),
    pdfAssetId: s.nullableString("The stored PDF asset id, or null."),
    fullPageArchiveAssetId: s.nullableString("The stored full page archive asset id, or null."),
    precrawledArchiveAssetId: s.nullableString("The stored precrawled archive asset id, or null."),
    videoAssetId: s.nullableString("The stored video asset id, or null."),
    favicon: s.nullableString("The crawled favicon URL, or null."),
    htmlContent: s.nullableString("The crawled HTML content, returned only when includeContent is true, or null."),
    contentAssetId: s.nullableString("The stored extracted content asset id, or null."),
    readerViewStatus: s.nullable(
      s.stringEnum("Whether the page can be rendered in reader view.", [
        "readable",
        "not_readable",
        "uncertain",
        "unavailable",
      ]),
    ),
    readerViewScore: s.nullableInteger("The reader view readability score from 0 to 100, or null."),
    preferredPreview: s.nullable(
      s.stringEnum("The preview mode preferred for this bookmark.", ["reader_view", "screenshot", "overview"]),
    ),
    crawledAt: s.nullableString("When the link was last crawled, in ISO 8601 format, or null."),
    crawlStatus: jobStatusField("The crawl job status, or null."),
    author: s.nullableString("The extracted author, or null."),
    publisher: s.nullableString("The extracted publisher, or null."),
    datePublished: s.nullableString("The extracted publication date, or null."),
    dateModified: s.nullableString("The extracted modification date, or null."),
    text: s.string("The note body, for text bookmarks."),
    sourceUrl: s.nullableString("The original source URL, for text and asset bookmarks, or null."),
    assetType: s.stringEnum("The uploaded asset kind, for asset bookmarks.", ["image", "pdf"]),
    assetId: s.string("The uploaded asset id, for asset bookmarks."),
    fileName: s.nullableString("The uploaded file name, for asset bookmarks, or null."),
    size: s.nullableNumber("The uploaded file size in bytes, for asset bookmarks, or null."),
    content: s.nullableString(
      "The text extracted from the uploaded asset, returned only when includeContent is true, or null.",
    ),
  },
  { required: ["type"], additionalProperties: true },
);

const bookmarkCoreProperties = {
  id: s.string("The bookmark id."),
  firstCreatedAt: s.string("When the bookmark was first created, in ISO 8601 format."),
  createdAt: s.string("When the bookmark was created, in ISO 8601 format."),
  modifiedAt: s.nullableString("When the bookmark was last modified, in ISO 8601 format, or null."),
  title: s.nullableString("The user supplied title, or null when Karakeep uses the crawled title."),
  archived: s.boolean("Whether the bookmark is archived."),
  favourited: s.boolean("Whether the bookmark is favourited."),
  taggingStatus: jobStatusField("The AI tagging job status, or null."),
  summarizationStatus: jobStatusField("The AI summarization job status, or null."),
  embeddingStatus: jobStatusField("The embedding job status, or null."),
  note: s.nullableString("The user note attached to the bookmark, or null."),
  summary: s.nullableString("The AI generated summary, or null."),
  source: s.nullable(s.stringEnum("How the bookmark entered Karakeep.", bookmarkSourceValues)),
  userId: s.string("The id of the user who owns the bookmark."),
};

const bookmarkCoreOptionalFields = ["firstCreatedAt", "title", "note", "summary", "source"];

const bookmarkCoreSchema: JsonSchema = s.looseRequiredObject(
  "A Karakeep bookmark without its tags, content and assets.",
  bookmarkCoreProperties,
  { optional: bookmarkCoreOptionalFields },
);

export const bookmarkSchema: JsonSchema = s.looseRequiredObject(
  "A Karakeep bookmark.",
  {
    ...bookmarkCoreProperties,
    tags: s.array("The tags attached to the bookmark.", bookmarkTagSchema),
    content: bookmarkContentSchema,
    assets: s.array("The assets attached to the bookmark.", bookmarkAssetRefSchema),
  },
  { optional: bookmarkCoreOptionalFields },
);

export const createdBookmarkSchema: JsonSchema = extendObjectSchema(
  "The created bookmark, or the bookmark that already existed for the same URL.",
  bookmarkSchema,
  {
    alreadyExists: s.boolean(
      "Whether the URL was already bookmarked, in which case Karakeep returned the existing bookmark instead of creating a duplicate.",
    ),
  },
);

export const updatedBookmarkSchema: JsonSchema = extendObjectSchema(
  "The bookmark after the update. Current Karakeep versions also return the tags, content and assets.",
  bookmarkCoreSchema,
  {
    tags: s.array("The tags attached to the bookmark.", bookmarkTagSchema),
    content: bookmarkContentSchema,
    assets: s.array("The assets attached to the bookmark.", bookmarkAssetRefSchema),
  },
  { optional: ["tags", "content", "assets"] },
);

export const paginatedBookmarksSchema: JsonSchema = s.looseRequiredObject("A page of bookmarks.", {
  bookmarks: s.array("The bookmarks on this page.", bookmarkSchema),
  nextCursor: nextCursorField,
});

export const listSchema: JsonSchema = s.looseRequiredObject(
  "A Karakeep list.",
  {
    id: s.string("The list id."),
    name: s.string("The list name."),
    description: s.nullableString("The list description, or null."),
    icon: s.string("The emoji used as the list icon."),
    parentId: s.nullableString("The id of the parent list, or null for a top level list."),
    type: s.stringEnum("Whether the list is manually curated or driven by a saved query.", ["manual", "smart"]),
    query: s.nullableString("The saved search query for a smart list, or null."),
    public: s.boolean("Whether the list is publicly shared."),
    hasCollaborators: s.boolean("Whether the list is shared with collaborators."),
    userRole: s.stringEnum("The role the connected user has on the list.", ["owner", "editor", "viewer", "public"]),
  },
  { optional: ["description", "type", "query"] },
);

export const tagSchema: JsonSchema = s.looseRequiredObject("A Karakeep tag.", {
  id: s.string("The tag id."),
  name: s.string("The tag name."),
  numBookmarks: s.number("How many bookmarks carry the tag."),
  numBookmarksByAttachedType: s.looseObject("How many bookmarks carry the tag, split by who attached it.", {
    ai: s.number("How many attachments were made by AI tagging."),
    human: s.number("How many attachments were made by a human."),
  }),
});

export const paginatedTagsSchema: JsonSchema = s.looseRequiredObject("A page of tags.", {
  tags: s.array("The tags on this page.", tagSchema),
  nextCursor: s.describe(
    nextCursorField,
    "Opaque cursor for the next page of tags, or null when there are no more tags. Tag cursors are only accepted by list_tags.",
  ),
});

export const tagBasicSchema: JsonSchema = s.looseRequiredObject("A Karakeep tag identified by id and name.", {
  id: s.string("The tag id."),
  name: s.string("The normalized tag name stored by Karakeep."),
});

export const manipulatedTagSchema: JsonSchema = s.object(
  "A tag reference identified by id or by name. Every entry must provide either tagId or tagName.",
  {
    tagId: karakeepIdField("The id of an existing tag."),
    tagName: s.nonEmptyString("The tag name; Karakeep creates the tag when it does not exist yet."),
    attachedBy: s.stringEnum("Who the attachment should be attributed to.", ["ai", "human"]),
  },
  { optional: ["tagId", "tagName", "attachedBy"] },
);

export const highlightSchema: JsonSchema = s.looseRequiredObject(
  "A Karakeep highlight on a bookmark.",
  {
    id: s.string("The highlight id."),
    bookmarkId: s.string("The id of the highlighted bookmark."),
    startOffset: s.number("The start offset of the highlight in the rendered content."),
    endOffset: s.number("The end offset of the highlight in the rendered content."),
    color: s.stringEnum("The highlight color.", ["yellow", "red", "green", "blue"]),
    text: s.nullableString("The highlighted text, or null."),
    note: s.nullableString("The note attached to the highlight, or null."),
    userId: s.string("The id of the user who created the highlight."),
    createdAt: s.string("When the highlight was created, in ISO 8601 format."),
  },
  { optional: ["color"] },
);

export const paginatedHighlightsSchema: JsonSchema = s.looseRequiredObject("A page of highlights.", {
  highlights: s.array("The highlights on this page.", highlightSchema),
  nextCursor: nextCursorField,
});

export const feedSchema: JsonSchema = s.looseRequiredObject("A Karakeep RSS feed.", {
  id: s.string("The feed id."),
  name: s.string("The feed name."),
  url: s.string("The feed URL."),
  enabled: s.boolean("Whether Karakeep fetches the feed on a schedule."),
  importTags: s.boolean("Whether tags published by the feed are imported onto new bookmarks."),
  lastFetchedStatus: jobStatusField("The status of the last fetch attempt, or null."),
  lastFetchedAt: s.nullableString("When the feed was last fetched, in ISO 8601 format, or null when never fetched."),
  lastSuccessfulFetchAt: s.nullableString("When the feed was last fetched successfully, in ISO 8601 format, or null."),
});

export const backupSchema: JsonSchema = s.looseRequiredObject(
  "A Karakeep account backup record.",
  {
    id: s.string("The backup id."),
    userId: s.string("The id of the user who owns the backup."),
    assetId: s.nullableString(
      "The id of the generated archive asset, or null while the backup is still pending or has failed.",
    ),
    createdAt: s.string("When the backup was requested, in ISO 8601 format."),
    size: s.number("The archive size in bytes; zero while the backup is pending."),
    bookmarkCount: s.number("How many bookmarks the archive contains; zero while pending."),
    status: s.stringEnum("The backup job status.", ["pending", "success", "failure"]),
    errorMessage: s.nullableString("Why the backup failed, or null."),
  },
  { optional: ["errorMessage"] },
);

export const uploadedAssetSchema: JsonSchema = s.looseRequiredObject("An asset uploaded to Karakeep.", {
  assetId: s.string("The unique identifier assigned to the uploaded asset."),
  contentType: s.string("The MIME type of the uploaded file."),
  size: s.number("The size of the uploaded file in bytes."),
  fileName: s.string("The original file name of the uploaded file."),
});

export const signedAssetUrlSchema: JsonSchema = s.looseRequiredObject(
  "A short lived download URL for a Karakeep asset.",
  {
    assetId: s.string("The unique identifier of the asset."),
    signedUrl: s.string("The temporary URL for downloading the asset without an API key."),
    expiresAt: s.string("When the signed URL expires, in ISO 8601 format."),
  },
);

export const bookmarkReadableContentSchema: JsonSchema = s.looseRequiredObject(
  "One chunk of the readable content rendered from a bookmark.",
  {
    bookmarkId: s.string("The id of the bookmark the content was rendered from."),
    bookmarkType: s.stringEnum("The bookmark variant the content was rendered from.", ["link", "text", "asset"]),
    format: s.stringEnum("The format of the returned content.", ["markdown", "text"]),
    content: s.string("The content chunk."),
    contentVersion: s.string("A hash identifying the rendered content version this cursor belongs to."),
    range: s.looseRequiredObject("The character range covered by this chunk.", {
      start: s.integer("Zero-based start offset in Unicode characters, inclusive."),
      end: s.integer("Zero-based end offset in Unicode characters, exclusive."),
      total: s.integer("Total number of Unicode characters in the rendered content."),
    }),
    nextCursor: s.nullable(s.string("Cursor for the next content chunk, or null when the content is exhausted.")),
    truncated: s.boolean("Whether more content remains after this chunk."),
  },
);

export const currentUserSchema: JsonSchema = s.looseRequiredObject(
  "The Karakeep user that owns the connected API key.",
  {
    id: s.string("The user id."),
    name: s.nullableString("The display name, or null when the account has none."),
    email: s.nullableString("The email address, or null when the account has none."),
    image: s.nullableString("The avatar image URL, or null when the account has none."),
    localUser: s.boolean(
      "Whether the account is a local Karakeep account rather than an external identity provider account.",
    ),
  },
);

export const userStatsSchema: JsonSchema = s.looseRequiredObject("Usage statistics for the connected Karakeep user.", {
  numBookmarks: s.number("How many bookmarks the user owns."),
  numFavorites: s.number("How many bookmarks are favourited."),
  numArchived: s.number("How many bookmarks are archived."),
  numTags: s.number("How many tags the user owns."),
  numLists: s.number("How many lists the user owns."),
  numHighlights: s.number("How many highlights the user owns."),
  bookmarksByType: s.looseRequiredObject("How many bookmarks exist per bookmark variant.", {
    link: s.number("How many link bookmarks exist."),
    text: s.number("How many text bookmarks exist."),
    asset: s.number("How many asset bookmarks exist."),
  }),
  topDomains: s.array(
    "The ten most bookmarked domains.",
    s.looseRequiredObject("A bookmarked domain and its count.", {
      domain: s.string("The domain name."),
      count: s.number("How many bookmarks point at the domain."),
    }),
  ),
  totalAssetSize: s.number("Total stored asset size in bytes."),
  assetsByType: s.array(
    "Stored asset counts and sizes per asset kind.",
    s.looseRequiredObject("Stored assets of one kind.", {
      type: s.string("The asset kind."),
      count: s.number("How many assets of this kind are stored."),
      totalSize: s.number("Total size in bytes of the assets of this kind."),
    }),
  ),
  bookmarkingActivity: s.looseRequiredObject("How bookmarking activity is distributed in time.", {
    thisWeek: s.number("How many bookmarks were created this week."),
    thisMonth: s.number("How many bookmarks were created this month."),
    thisYear: s.number("How many bookmarks were created this year."),
    byHour: s.array(
      "Bookmark counts per hour of the day.",
      s.looseRequiredObject("Bookmark count for one hour of the day.", {
        hour: s.number("The hour of the day, from 0 to 23."),
        count: s.number("How many bookmarks were created in that hour."),
      }),
    ),
    byDayOfWeek: s.array(
      "Bookmark counts per day of the week.",
      s.looseRequiredObject("Bookmark count for one day of the week.", {
        day: s.number("The day of the week, from 0 for Sunday to 6 for Saturday."),
        count: s.number("How many bookmarks were created on that day."),
      }),
    ),
  }),
  tagUsage: s.array(
    "The ten most used tags.",
    s.looseRequiredObject("A tag and how often it is used.", {
      name: s.string("The tag name."),
      count: s.number("How many bookmarks carry the tag."),
    }),
  ),
  bookmarksBySource: s.array(
    "Bookmark counts per capture source.",
    s.looseRequiredObject("Bookmark count for one capture source.", {
      source: s.nullable(
        s.stringEnum("The capture source, or null when Karakeep did not record one.", bookmarkSourceValues),
      ),
      count: s.number("How many bookmarks came from that source."),
    }),
  ),
});
