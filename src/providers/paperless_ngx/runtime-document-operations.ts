import type { PaperlessExecutionContext, PaperlessHandlerMap } from "./runtime-helpers.ts";

import { optionalInteger, optionalRecord } from "../../core/cast.ts";
import { ProviderRequestError, requiredResponseRecord } from "../provider-runtime.ts";
import {
  normalizePaperlessPage,
  paperlessBulkDownloadTimeoutMs,
  paperlessChatTimeoutMs,
  paperlessMaxBulkDownloadBytes,
  pickDocumentSelection,
  pickProvidedFields,
  readPaperlessResponseFileName,
  requirePaperlessFileTransit,
  requirePaperlessInputString,
  streamPaperlessResponseToTransit,
} from "./runtime-helpers.ts";

const pdfOutputOptionFields = ["update_document", "include_metadata", "delete_original", "source_mode"];

function requireDocumentIds(input: Record<string, unknown>): unknown[] {
  const documents = Array.isArray(input.documents) ? input.documents : [];
  if (documents.length === 0) {
    throw new ProviderRequestError(400, "documents must contain at least one id", undefined, "invalid_input");
  }
  return documents;
}

async function postDocumentOperation(
  context: PaperlessExecutionContext,
  operation: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return requiredResponseRecord(
    await context.request({ method: "POST", path: `/api/documents/${operation}/`, body }),
    `Paperless-ngx ${operation} response`,
  );
}

async function postTrashAction(
  context: PaperlessExecutionContext,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return requiredResponseRecord(
    await context.request({ method: "POST", path: "/api/trash/", body }),
    "Paperless-ngx trash response",
  );
}

export const paperlessNgxDocumentOperationActionHandlers: PaperlessHandlerMap = {
  async bulk_edit_documents(context, input) {
    const method = requirePaperlessInputString(input.method, "method");
    const parameters = optionalRecord(input.parameters) ?? {};
    return postDocumentOperation(context, "bulk_edit", {
      ...pickDocumentSelection(input),
      method,
      parameters,
    });
  },

  async delete_documents(context, input) {
    return postDocumentOperation(context, "delete", pickDocumentSelection(input));
  },

  async reprocess_documents(context, input) {
    return postDocumentOperation(context, "reprocess", {
      ...pickDocumentSelection(input),
      ...pickProvidedFields(input, ["remote_ocr"]),
    });
  },

  async rotate_documents(context, input) {
    const degrees = optionalInteger(input.degrees);
    if (degrees === undefined) {
      throw new ProviderRequestError(400, "degrees must be an integer", undefined, "invalid_input");
    }
    return postDocumentOperation(context, "rotate", {
      ...pickDocumentSelection(input),
      degrees,
      ...pickProvidedFields(input, ["source_mode"]),
    });
  },

  async merge_documents(context, input) {
    return postDocumentOperation(context, "merge", {
      documents: requireDocumentIds(input),
      ...pickProvidedFields(input, ["metadata_document_id", "delete_originals", "archive_fallback", "source_mode"]),
    });
  },

  async merge_documents_as_versions(context, input) {
    const documents = requireDocumentIds(input);
    const rootDocumentId = optionalInteger(input.root_document_id);
    if (rootDocumentId === undefined) {
      throw new ProviderRequestError(400, "root_document_id must be an integer", undefined, "invalid_input");
    }
    if (documents.length < 2) {
      throw new ProviderRequestError(400, "documents must contain at least two ids", undefined, "invalid_input");
    }
    if (!documents.includes(rootDocumentId)) {
      throw new ProviderRequestError(
        400,
        "root_document_id must be one of the selected documents",
        undefined,
        "invalid_input",
      );
    }
    return postDocumentOperation(context, "merge_as_versions", {
      documents,
      root_document_id: rootDocumentId,
      ...pickProvidedFields(input, ["version_label"]),
    });
  },

  async edit_document_pdf(context, input) {
    const documents = requireDocumentIds(input);
    const operations = Array.isArray(input.operations) ? input.operations : [];
    if (operations.length === 0) {
      throw new ProviderRequestError(
        400,
        "operations must contain at least one page entry",
        undefined,
        "invalid_input",
      );
    }
    return postDocumentOperation(context, "edit_pdf", {
      documents,
      operations,
      ...pickProvidedFields(input, pdfOutputOptionFields),
    });
  },

  async remove_document_password(context, input) {
    return postDocumentOperation(context, "remove_password", {
      documents: requireDocumentIds(input),
      password: requirePaperlessInputString(input.password, "password"),
      ...pickProvidedFields(input, pdfOutputOptionFields),
    });
  },

  async bulk_download_documents(context, input) {
    requirePaperlessFileTransit(context);
    const body = {
      ...pickDocumentSelection(input),
      ...pickProvidedFields(input, ["content", "compression", "follow_formatting"]),
    };
    return context.requestRaw(
      {
        method: "POST",
        path: "/api/documents/bulk_download/",
        body,
        timeoutMs: paperlessBulkDownloadTimeoutMs,
      },
      (response) =>
        streamPaperlessResponseToTransit(context, {
          response,
          name: readPaperlessResponseFileName(response) ?? "documents.zip",
          fallbackMimeType: "application/zip",
          maximumBytes: paperlessMaxBulkDownloadBytes,
        }),
    );
  },

  async get_selection_data(context, input) {
    return postDocumentOperation(context, "selection_data", {
      documents: requireDocumentIds(input),
    });
  },

  async list_trash(context, input) {
    return normalizePaperlessPage(
      await context.request({
        path: "/api/trash/",
        query: {
          page: optionalInteger(input.page),
          page_size: optionalInteger(input.page_size),
          full_perms: input.full_perms === true ? true : undefined,
        },
      }),
      "Paperless-ngx trash response",
    );
  },

  async restore_trash_documents(context, input) {
    return postTrashAction(context, { action: "restore", documents: requireDocumentIds(input) });
  },

  async empty_trash(context, input) {
    return postTrashAction(context, {
      action: "empty",
      ...pickProvidedFields(input, ["documents"]),
    });
  },

  async chat_with_documents(context, input) {
    const q = requirePaperlessInputString(input.q, "q");
    const answer = await context.requestRaw(
      {
        method: "POST",
        path: "/api/documents/chat/",
        body: { q, ...pickProvidedFields(input, ["document_id"]) },
        timeoutMs: paperlessChatTimeoutMs,
      },
      (response) => response.text(),
    );
    return { answer };
  },
};
