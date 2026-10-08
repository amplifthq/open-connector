import type { PaperlessHandler, PaperlessHandlerMap, PaperlessQueryValue } from "./runtime-helpers.ts";

import { optionalString, recordOrEmpty } from "../../core/cast.ts";
import { ProviderRequestError, requiredResponseRecord } from "../provider-runtime.ts";
import {
  deletedResult,
  encodePaperlessId,
  normalizePaperlessPage,
  pickProvidedFields,
  requirePaperlessUpdateFields,
} from "./runtime-helpers.ts";

interface ObjectResource {
  path: string;

  label: string;

  truthyListFlags?: readonly string[];
}

const listReservedKeys = ["additional_filters"];

function omitFields(input: Record<string, unknown>, reserved: readonly string[]): Record<string, unknown> {
  return pickProvidedFields(
    input,
    Object.keys(input).filter((key) => !reserved.includes(key)),
  );
}

function createObjectHandlers(
  resource: ObjectResource,
): Record<"list" | "get" | "create" | "update" | "delete", PaperlessHandler> {
  const detailPath = (id: unknown) => `${resource.path}${encodePaperlessId(id, "id")}/`;
  const truthyFlags = resource.truthyListFlags ?? [];
  return {
    async list(context, input) {
      const query = omitFields(input, [...listReservedKeys, ...truthyFlags]) as Record<string, PaperlessQueryValue>;
      for (const flag of truthyFlags) {
        if (input[flag] === true) query[flag] = true;
      }
      Object.assign(query, recordOrEmpty(input.additional_filters));
      return normalizePaperlessPage(
        await context.request({ path: resource.path, query }),
        `Paperless-ngx ${resource.label} list response`,
      );
    },

    async get(context, input) {
      return requiredResponseRecord(
        await context.request({
          path: detailPath(input.id),
          query: omitFields(input, ["id"]) as Record<string, PaperlessQueryValue>,
        }),
        `Paperless-ngx ${resource.label} response`,
      );
    },

    async create(context, input) {
      return requiredResponseRecord(
        await context.request({ method: "POST", path: resource.path, body: input }),
        `Paperless-ngx ${resource.label} create response`,
      );
    },

    async update(context, input) {
      const path = detailPath(input.id);
      const body = requirePaperlessUpdateFields(omitFields(input, ["id"]));
      return requiredResponseRecord(
        await context.request({ method: "PATCH", path, body }),
        `Paperless-ngx ${resource.label} update response`,
      );
    },

    async delete(context, input) {
      const id = encodePaperlessId(input.id, "id");
      await context.request({
        method: "DELETE",
        path: `${resource.path}${id}/`,
        expectJson: false,
      });
      return deletedResult({ id: Number(id) });
    },
  };
}

const tags = createObjectHandlers({ path: "/api/tags/", label: "tag" });
const correspondents = createObjectHandlers({
  path: "/api/correspondents/",
  label: "correspondent",
  truthyListFlags: ["last_correspondence"],
});
const documentTypes = createObjectHandlers({
  path: "/api/document_types/",
  label: "document type",
});
const storagePaths = createObjectHandlers({ path: "/api/storage_paths/", label: "storage path" });
const customFields = createObjectHandlers({ path: "/api/custom_fields/", label: "custom field" });
const savedViews = createObjectHandlers({ path: "/api/saved_views/", label: "saved view" });

export const paperlessNgxObjectActionHandlers: PaperlessHandlerMap = {
  list_tags: tags.list,
  get_tag: tags.get,
  create_tag: tags.create,
  update_tag: tags.update,
  delete_tag: tags.delete,

  list_correspondents: correspondents.list,
  get_correspondent: correspondents.get,
  create_correspondent: correspondents.create,
  update_correspondent: correspondents.update,
  delete_correspondent: correspondents.delete,

  list_document_types: documentTypes.list,
  get_document_type: documentTypes.get,
  create_document_type: documentTypes.create,
  update_document_type: documentTypes.update,
  delete_document_type: documentTypes.delete,

  list_storage_paths: storagePaths.list,
  get_storage_path: storagePaths.get,
  create_storage_path: storagePaths.create,
  update_storage_path: storagePaths.update,
  delete_storage_path: storagePaths.delete,

  async test_storage_path(context, input) {
    const response = await context.request({
      method: "POST",
      path: "/api/storage_paths/test/",
      body: { path: input.path, document: input.document },
    });
    const rendered = optionalString(response);
    if (rendered === undefined && response !== undefined && response !== null) {
      throw new ProviderRequestError(
        502,
        "Paperless-ngx storage path test response must be a string",
        undefined,
        "provider_error",
      );
    }
    return { result: rendered ?? null };
  },

  list_custom_fields: customFields.list,
  get_custom_field: customFields.get,
  create_custom_field: customFields.create,
  update_custom_field: customFields.update,
  delete_custom_field: customFields.delete,

  list_saved_views: savedViews.list,
  get_saved_view: savedViews.get,
  create_saved_view: savedViews.create,
  update_saved_view: savedViews.update,
  delete_saved_view: savedViews.delete,

  async bulk_edit_objects(context, input) {
    const all = input.all === true;
    const objects = Array.isArray(input.objects) ? input.objects : [];
    if (!all && objects.length === 0) {
      throw new ProviderRequestError(400, "objects is required unless all is true", undefined, "invalid_input");
    }
    if (input.operation === "set_permissions" && input.owner === undefined && input.permissions === undefined) {
      throw new ProviderRequestError(400, "set_permissions requires owner or permissions", undefined, "invalid_input");
    }
    return requiredResponseRecord(
      await context.request({ method: "POST", path: "/api/bulk_edit_objects/", body: input }),
      "Paperless-ngx bulk edit objects response",
    );
  },
};
