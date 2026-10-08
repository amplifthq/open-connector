import type { JsonSchema } from "../../core/types.ts";

import { s } from "../../core/json-schema.ts";

export function typeUnion(description: string, types: Array<"string" | "number" | "boolean">): JsonSchema {
  return s.anyOf(
    types.map((type) => ({ type })),
    { description },
  );
}

export function extendObject(
  description: string,
  base: JsonSchema,
  properties: Record<string, JsonSchema>,
  options: { optional?: readonly string[] } = {},
): JsonSchema {
  const merged = { ...(base.properties ?? {}), ...properties };
  return s.object(merged, {
    description,
    optional: options.optional,
    additionalProperties: true,
  });
}

export function nullableString(description: string, options: { maxLength?: number } = {}): JsonSchema {
  return s.nullable(s.string({ description, maxLength: options.maxLength }));
}

export const emptyInputSchema: JsonSchema = s.object("The input payload for this action.", {});

export function integerEnum(
  description: string,
  values: readonly number[],
  options: { default?: number } = {},
): JsonSchema {
  return {
    type: "integer",
    enum: values,
    ...(options.default === undefined ? {} : { default: options.default }),
    description,
  };
}

export function idField(description: string): JsonSchema {
  return s.positiveInteger(description);
}

export function idArrayField(description: string, itemDescription: string): JsonSchema {
  return s.array(description, s.positiveInteger(itemDescription));
}

export const pageInputFields: Record<string, JsonSchema> = {
  page: s.positiveInteger("One-based page number. Defaults to 1."),
  page_size: s.integer("Number of results per page. Defaults to 25; the upstream maximum is 100000.", {
    minimum: 1,
    maximum: 100000,
  }),
  ordering: s.nonEmptyString(
    "Field to order by, prefixed with - for descending order, for example -created. Only the ordering fields documented for this resource are accepted.",
  ),
};

export const fullPermsInputField: JsonSchema = s.boolean(
  "When true, return the full object permissions in the permissions field instead of only user_can_change. Defaults to false.",
);

export const additionalFiltersInputField: JsonSchema = s.record(
  "Additional documented query parameters to append verbatim, keyed by parameter name, for less common filters such as name__istartswith or created__year. Arrays are joined with commas and booleans are sent as true/false.",
  typeUnion("A query parameter value.", ["string", "number", "boolean"]),
);

export const paginationOutputFields: Record<string, JsonSchema> = {
  count: s.nonNegativeInteger("Total number of matching resources across all pages."),
  next: s.nullableString("Absolute URL of the next page, or null on the last page."),
  previous: s.nullableString("Absolute URL of the previous page, or null on the first page."),
};

export function paginatedOutputSchema(
  description: string,
  items: JsonSchema,
  extraFields: Record<string, JsonSchema> = {},
): JsonSchema {
  return s.looseRequiredObject(
    description,
    {
      ...paginationOutputFields,
      results: s.array("The resources on this page.", items),
      ...extraFields,
    },
    { optional: Object.keys(extraFields) },
  );
}

export const resultOutputSchema: JsonSchema = s.looseRequiredObject("The upstream operation result.", {
  result: s.string('The upstream result marker, normally "OK".'),
});

export function deletedOutputSchema(description: string, idName: string, idDescription: string): JsonSchema {
  return s.requiredObject(description, {
    success: s.boolean("Whether Paperless-ngx accepted the deletion."),
    [idName]: s.positiveInteger(idDescription),
  });
}

export const transitFileFields: Record<string, JsonSchema> = {
  file: s.object(
    {
      fileId: s.nonEmptyString("The local transit file identifier."),
      downloadUrl: s.url("A temporary URL for downloading the local transit file."),
      sizeBytes: s.nonNegativeInteger("The stored file size in bytes."),
      name: s.nonEmptyString("The stored file name."),
      mimeType: s.nonEmptyString("The stored file MIME type."),
    },
    { required: ["fileId", "downloadUrl", "sizeBytes", "name", "mimeType"] },
  ),
  fileName: s.string("File name the downloaded bytes were stored under."),
  contentType: s.string("MIME type reported for the downloaded bytes."),
  sizeBytes: s.number("Number of bytes transferred to the local transit file."),
};

export const transitFileOutputSchema: JsonSchema = s.requiredObject(
  "The downloaded file, handed back as a local transit file.",
  transitFileFields,
);

export const transitFileInputField: JsonSchema = s.transitFile(
  "A file uploaded to the local transit file API to forward to Paperless-ngx.",
);

export const fileNameInputField: JsonSchema = s.nonEmptyString(
  "File name to submit with the upload. Defaults to the transit file name. Paperless-ngx sanitizes it and uses the extension to pick a parser, so keep the real extension.",
);

const permissionActorsInputSchema = s.object(
  "Users and groups granted this permission.",
  {
    users: idArrayField("User ids.", "A user id."),
    groups: idArrayField("Group ids.", "A group id."),
  },
  { optional: ["users", "groups"] },
);

export const setPermissionsInputSchema: JsonSchema = s.object(
  "Object-level permissions to write. Supplying this replaces the existing permissions of the object; only the owner or a superuser may change them.",
  {
    view: permissionActorsInputSchema,
    change: permissionActorsInputSchema,
  },
  { optional: ["view", "change"] },
);

export const ownerInputField: JsonSchema = s.nullableInteger(
  "Id of the user that owns the object, or null to make it unowned.",
);

const permissionActorsOutputSchema = s.looseObject("Users and groups holding this permission.", {
  users: s.array("User ids.", s.integer("A user id.")),
  groups: s.array("Group ids.", s.integer("A group id.")),
});

export const permissionsOutputSchema: JsonSchema = s.looseObject(
  "Object-level permissions. Only populated in full when full_perms is true; otherwise Paperless-ngx returns a truncated form.",
  {
    view: permissionActorsOutputSchema,
    change: permissionActorsOutputSchema,
  },
);

export const ownedObjectOutputFields: Record<string, JsonSchema> = {
  owner: s.nullableInteger("Id of the owning user, or null when the object is unowned."),
  permissions: permissionsOutputSchema,
  user_can_change: s.boolean("Whether the connected user may modify this object."),
};

export const matchingAlgorithmValues: readonly number[] = [0, 1, 2, 3, 4, 5, 6];

export const matchingAlgorithmDescription: string =
  "Matching algorithm: 0 none, 1 any word, 2 all words, 3 exact match, 4 regular expression, 5 fuzzy word, 6 automatic (classifier).";

export const matchingInputFields: Record<string, JsonSchema> = {
  match: s.string("Text or pattern the matching algorithm compares against document content."),
  matching_algorithm: integerEnum(matchingAlgorithmDescription, matchingAlgorithmValues),
  is_insensitive: s.boolean("Whether matching ignores case. Defaults to true."),
};

export const matchingOutputFields: Record<string, JsonSchema> = {
  id: s.integer("The object id."),
  slug: s.string("URL-safe slug derived from the name."),
  name: s.string("The object name."),
  match: s.string("Text or pattern used by the matching algorithm."),
  matching_algorithm: s.integer(matchingAlgorithmDescription),
  is_insensitive: s.boolean("Whether matching ignores case."),
  document_count: s.integer("Number of documents visible to the connected user that use this object."),
  ...ownedObjectOutputFields,
};

export const tagSchema: JsonSchema = s.looseObject("A Paperless-ngx tag.", {
  ...matchingOutputFields,
  color: s.string("Hex color such as #a6cee3."),
  text_color: s.string("Black or white text color chosen for contrast against color."),
  is_inbox_tag: s.boolean("Whether new documents automatically receive this tag."),
  parent: s.nullableInteger("Id of the parent tag, or null for a root tag."),
  children: s.array("Child tags, each with the same shape as a tag.", s.looseObject("A child tag.")),
});

export const correspondentSchema: JsonSchema = s.looseObject("A Paperless-ngx correspondent.", {
  ...matchingOutputFields,
  last_correspondence: s.nullableString("Date of the most recent document from this correspondent, when requested."),
});

export const documentTypeSchema: JsonSchema = s.looseObject("A Paperless-ngx document type.", matchingOutputFields);

export const storagePathSchema: JsonSchema = s.looseObject("A Paperless-ngx storage path.", {
  ...matchingOutputFields,
  path: s.string("Filename template used to place documents under the media directory."),
});

export const customFieldDataTypeValues: readonly string[] = [
  "string",
  "url",
  "date",
  "boolean",
  "integer",
  "float",
  "monetary",
  "documentlink",
  "select",
  "longtext",
];

export const customFieldSchema: JsonSchema = s.looseObject("A Paperless-ngx custom field.", {
  id: s.integer("The custom field id."),
  name: s.string("The custom field name."),
  data_type: s.string(
    "The value type: string, url, date, boolean, integer, float, monetary, documentlink, select or longtext.",
  ),
  extra_data: s.nullable(
    s.looseObject(
      "Type-specific settings, such as select_options for select fields or default_currency for monetary fields.",
    ),
  ),
  document_count: s.integer("Number of documents that carry this field."),
});

export const customFieldInstanceSchema: JsonSchema = s.looseObject("A custom field value attached to a document.", {
  field: s.integer("The custom field id."),
  value: s.unknown(
    "The value in the field's data type: string, number, boolean, ISO date, select option id, or an array of document ids for document links. Null clears the value.",
  ),
});

export const customFieldInstanceInputSchema: JsonSchema = s.object("A custom field value to store on the document.", {
  field: idField("The custom field id."),
  value: s.unknown(
    "The value in the field's data type: string, number, boolean, ISO date, select option id, or an array of document ids for document links. Null clears the value.",
  ),
});

export const noteSchema: JsonSchema = s.looseObject("A note attached to a document.", {
  id: s.integer("The note id."),
  note: s.string("The note text."),
  created: s.string("ISO 8601 creation timestamp."),
  user: s.nullable(
    s.looseObject("The user who wrote the note.", {
      id: s.integer("The user id."),
      username: s.string("The username."),
      first_name: s.string("The first name."),
      last_name: s.string("The last name."),
    }),
  ),
});

export const documentVersionSchema: JsonSchema = s.looseObject("A file-level version of a document.", {
  id: s.integer("The version's document id."),
  added: s.string("ISO 8601 timestamp when the version was added."),
  version_label: s.nullableString("Optional label for the version."),
  checksum: s.nullableString("MD5 checksum of the version's original file."),
  is_root: s.boolean("Whether this entry is the root (original) document."),
});

export const documentSchema: JsonSchema = s.looseObject("A Paperless-ngx document.", {
  id: s.integer("The document id."),
  correspondent: s.nullableInteger("Correspondent id, or null."),
  document_type: s.nullableInteger("Document type id, or null."),
  storage_path: s.nullableInteger("Storage path id, or null."),
  title: s.string("The document title."),
  content: s.string("Extracted text content of the latest version, possibly truncated when truncate_content is true."),
  tags: s.array("Ids of the tags assigned to the document.", s.integer("A tag id.")),
  created: s.string("Creation date as YYYY-MM-DD."),
  created_date: s.string("Deprecated duplicate of created."),
  modified: s.string("ISO 8601 timestamp of the last modification."),
  added: s.string("ISO 8601 timestamp when the document was added."),
  deleted_at: s.nullableString("ISO 8601 timestamp when the document was moved to the trash, or null."),
  archive_serial_number: s.nullableInteger("Archive serial number (ASN), or null."),
  original_file_name: s.nullableString("File name of the original upload."),
  archived_file_name: s.nullableString("Public file name of the archived PDF, or null when no archive version exists."),
  duplicate_documents: s.array(
    "Other documents sharing the same checksum, only populated on single document reads.",
    s.looseObject("A duplicate document summary.", {
      id: s.integer("The duplicate document id."),
      title: s.string("The duplicate document title."),
      deleted_at: s.nullableString("When the duplicate was trashed, or null."),
    }),
  ),
  ...ownedObjectOutputFields,
  is_shared_by_requester: s.boolean("Whether the connected user owns the document and has shared it with others."),
  notes: s.array("Notes attached to the document.", noteSchema),
  custom_fields: s.array("Custom field values attached to the document.", customFieldInstanceSchema),
  page_count: s.nullableInteger("Number of pages, or null when unknown."),
  mime_type: s.string("MIME type of the original file."),
  root_document: s.nullableInteger("Id of the root document when this entry is a version, or null."),
  versions: s.array("File-level versions of the document.", documentVersionSchema),
  __search_hit__: s.looseObject("Search result details, only present on full text search results.", {
    score: s.number("Relevance score relative to the other results."),
    highlights: s.string("Excerpt of the content with matching terms wrapped in span tags."),
    rank: s.integer("Zero-based rank of the result."),
  }),
});

export const documentSelectionInputFields: Record<string, JsonSchema> = {
  documents: idArrayField("Ids of the documents to operate on.", "A document id."),
  all: s.boolean(
    "When true, operate on every document visible to the connected user that matches filters instead of the explicit documents list. Defaults to false.",
  ),
  filters: s.record(
    "Document list filters applied when all is true, keyed by the same query parameter names accepted by list_documents (for example tags__id__all or query).",
    typeUnion("A filter value.", ["string", "number", "boolean"]),
  ),
};

export const savedViewSchema: JsonSchema = s.looseObject("A Paperless-ngx saved view.", {
  id: s.integer("The saved view id."),
  name: s.string("The saved view name."),
  icon: s.nullableString("Icon name shown next to the view, or null."),
  sort_field: s.nullableString("Field the view sorts by."),
  sort_reverse: s.boolean("Whether the sort is descending."),
  filter_rules: s.array(
    "Filter rules that define the view.",
    s.looseObject("A saved view filter rule.", {
      rule_type: s.integer("Numeric filter rule type."),
      value: s.nullableString("Rule value, or null."),
    }),
  ),
  page_size: s.nullableInteger("Page size used when displaying the view, or null."),
  display_mode: s.nullableString("Display mode: table, smallCards or largeCards."),
  display_fields: s.nullable(s.array("Fields shown in the view.", s.string("A display field name."))),
  ...ownedObjectOutputFields,
});

export const userSchema: JsonSchema = s.looseObject("A Paperless-ngx user.", {
  id: s.integer("The user id."),
  username: s.string("The username."),
  email: s.string("The email address."),
  password: s.string("Obfuscated placeholder; the real password is never returned."),
  first_name: s.string("The first name."),
  last_name: s.string("The last name."),
  date_joined: s.string("ISO 8601 timestamp when the user was created."),
  is_staff: s.boolean("Whether the user may access the admin site."),
  is_active: s.boolean("Whether the account is active."),
  is_superuser: s.boolean("Whether the user is a superuser."),
  groups: s.array("Ids of the groups the user belongs to.", s.integer("A group id.")),
  user_permissions: s.array("Permission codenames granted directly to the user.", s.string("A permission codename.")),
  inherited_permissions: s.array("Permission codenames inherited from groups.", s.string("A permission codename.")),
  is_mfa_enabled: s.boolean("Whether TOTP multi-factor authentication is active."),
});

export const groupSchema: JsonSchema = s.looseObject("A Paperless-ngx group.", {
  id: s.integer("The group id."),
  name: s.string("The group name."),
  permissions: s.array("Permission codenames granted to the group.", s.string("A permission codename.")),
});

export const taskStatusValues: readonly string[] = ["pending", "started", "success", "failure", "revoked"];

export const taskTypeValues: readonly string[] = [
  "consume_file",
  "train_classifier",
  "sanity_check",
  "index_optimize",
  "mail_fetch",
  "llm_index",
  "empty_trash",
  "check_workflows",
  "bulk_update",
  "reprocess_document",
  "build_share_link",
  "bulk_delete",
  "apply_ai_suggestions",
];

export const triggerSourceValues: readonly string[] = [
  "scheduled",
  "web_ui",
  "api_upload",
  "folder_consume",
  "email_consume",
  "system",
  "manual",
];

export const taskSchema: JsonSchema = s.looseObject("A Paperless-ngx background task.", {
  id: s.integer("The task row id."),
  task_id: s.string("The Celery task UUID."),
  task_type: s.string("Task type such as consume_file or train_classifier."),
  task_type_display: s.string("Human readable task type."),
  trigger_source: s.string("What triggered the task, such as api_upload or scheduled."),
  trigger_source_display: s.string("Human readable trigger source."),
  status: s.string("Task status: pending, started, success, failure or revoked."),
  status_display: s.string("Human readable status."),
  date_created: s.string("ISO 8601 timestamp when the task was created."),
  date_started: s.nullableString("ISO 8601 timestamp when the task started, or null."),
  date_done: s.nullableString("ISO 8601 timestamp when the task finished, or null."),
  duration_seconds: s.nullableNumber("Run time in seconds, or null while running."),
  wait_time_seconds: s.nullableNumber("Queue wait time in seconds, or null."),
  input_data: s.nullable(s.looseObject("Task input such as the uploaded filename.")),
  result_data: s.nullable(
    s.looseObject("Task result such as document_id, message or error_message.", {
      document_id: s.integer("Id of the document created by a consumption task."),
      message: s.string("Human readable result message."),
      error_message: s.string("Error message when the task failed."),
    }),
  ),
  related_document_ids: s.array("Ids of documents related to the task.", s.integer("A document id.")),
  acknowledged: s.boolean("Whether the task has been acknowledged (dismissed) in the UI."),
  owner: s.nullableInteger("Id of the user who owns the task, or null for system tasks."),
});

export const shareLinkSchema: JsonSchema = s.looseObject("A Paperless-ngx share link.", {
  id: s.integer("The share link id."),
  created: s.string("ISO 8601 creation timestamp."),
  expiration: s.nullableString("ISO 8601 expiration timestamp, or null when it never expires."),
  slug: s.string("Slug that forms the public URL <instance>/share/<slug>."),
  document: s.integer("Id of the shared document."),
  file_version: s.string("Which file is served: archive or original."),
});

export const workflowSchema: JsonSchema = s.looseObject("A Paperless-ngx workflow.", {
  id: s.integer("The workflow id."),
  name: s.string("The workflow name."),
  order: s.integer("Evaluation order among workflows."),
  enabled: s.boolean("Whether the workflow is active."),
  triggers: s.array("Triggers that start the workflow.", s.looseObject("A workflow trigger.")),
  actions: s.array("Actions the workflow performs.", s.looseObject("A workflow action.")),
});

export const mailAccountSchema: JsonSchema = s.looseObject("A Paperless-ngx mail account.", {
  id: s.integer("The mail account id."),
  name: s.string("The account name."),
  imap_server: s.string("IMAP server host."),
  imap_port: s.nullableInteger("IMAP port."),
  imap_security: s.integer("IMAP security: 1 none, 2 SSL, 3 STARTTLS."),
  username: s.string("IMAP username."),
  password: s.string("Obfuscated placeholder; the real password is never returned."),
  character_set: s.string("Character set used to decode mail."),
  is_token: s.boolean("Whether password holds an OAuth token."),
  account_type: s.integer("Account type: 1 IMAP, 2 Gmail OAuth, 3 Outlook OAuth."),
  expiration: s.nullableString("OAuth token expiration, or null."),
  ...ownedObjectOutputFields,
});

export const mailRuleSchema: JsonSchema = s.looseObject("A Paperless-ngx mail rule.", {
  id: s.integer("The mail rule id."),
  name: s.string("The rule name."),
  account: s.integer("Id of the mail account the rule belongs to."),
  enabled: s.boolean("Whether the rule is active."),
  folder: s.string("IMAP folder to scan."),
  filter_from: s.nullableString("Sender filter, or null."),
  filter_to: s.nullableString("Recipient filter, or null."),
  filter_subject: s.nullableString("Subject filter, or null."),
  filter_body: s.nullableString("Body filter, or null."),
  filter_attachment_filename_include: s.nullableString("Attachment filename include pattern, or null."),
  filter_attachment_filename_exclude: s.nullableString("Attachment filename exclude pattern, or null."),
  maximum_age: s.integer("Maximum mail age in days, 0 for no limit."),
  action: s.integer("Post-consumption mail action: 1 delete, 2 move, 3 mark read, 4 flag, 5 tag."),
  action_parameter: s.nullableString("Folder or tag used by the action, or null."),
  assign_title_from: s.integer("Title source: 1 subject, 2 attachment filename, 3 none."),
  assign_tags: s.array("Ids of tags assigned to consumed documents.", s.integer("A tag id.")),
  assign_correspondent_from: s.integer("Correspondent source: 1 nothing, 2 email, 3 name, 4 custom."),
  assign_correspondent: s.nullableInteger("Correspondent id used when assign_correspondent_from is 4, or null."),
  assign_document_type: s.nullableInteger("Document type id assigned to consumed documents, or null."),
  assign_owner_from_rule: s.boolean("Whether consumed documents are owned by the rule owner."),
  order: s.integer("Evaluation order among rules."),
  attachment_type: s.integer("Attachment processing: 1 attachments only, 2 everything including inline."),
  consumption_scope: s.integer("Consumption scope: 1 attachments only, 2 eml only, 3 everything."),
  pdf_layout: s.integer(
    "PDF layout for mail bodies: 0 system default, 1 text then HTML, 2 HTML then text, 3 HTML only, 4 text only.",
  ),
  stop_processing: s.boolean("Whether later rules are skipped once this rule matches."),
  ...ownedObjectOutputFields,
});
