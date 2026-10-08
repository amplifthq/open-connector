import type { PaperlessHandlerMap, PaperlessQueryValue } from "./runtime-helpers.ts";

import { optionalRecord } from "../../core/cast.ts";
import { requiredResponseRecord } from "../provider-runtime.ts";
import { paperlessResponseBoolean } from "./runtime-helpers.ts";
import {
  deletedResult,
  encodePaperlessId,
  normalizePaperlessPage,
  pickProvidedFields,
  requirePaperlessInputString,
  requirePaperlessUpdateFields,
} from "./runtime-helpers.ts";

const pageQueryFields = ["page", "page_size", "ordering"];

const userFilterFields = ["username__istartswith", "username__iendswith", "username__icontains", "username__iexact"];

const groupFilterFields = ["name__istartswith", "name__iendswith", "name__icontains", "name__iexact"];

const userWriteFields = [
  "username",
  "email",
  "password",
  "first_name",
  "last_name",
  "is_staff",
  "is_active",
  "is_superuser",
  "groups",
  "user_permissions",
];

const groupWriteFields = ["name", "permissions"];

const profileWriteFields = ["email", "password", "first_name", "last_name"];

function buildListQuery(
  input: Record<string, unknown>,
  fields: readonly string[],
): Record<string, PaperlessQueryValue> {
  return {
    ...(pickProvidedFields(input, [...pageQueryFields, ...fields]) as Record<string, PaperlessQueryValue>),
    ...((optionalRecord(input.additional_filters) ?? {}) as Record<string, PaperlessQueryValue>),
  };
}

export const paperlessNgxUserActionHandlers: PaperlessHandlerMap = {
  async list_users(context, input) {
    return normalizePaperlessPage(
      await context.request({
        path: "/api/users/",
        query: buildListQuery(input, userFilterFields),
      }),
      "Paperless-ngx users response",
    );
  },

  async get_user(context, input) {
    const id = encodePaperlessId(input.id, "id");
    return {
      user: requiredResponseRecord(await context.request({ path: `/api/users/${id}/` }), "Paperless-ngx user response"),
    };
  },

  async create_user(context, input) {
    const username = requirePaperlessInputString(input.username, "username");
    return {
      user: requiredResponseRecord(
        await context.request({
          method: "POST",
          path: "/api/users/",
          body: { ...pickProvidedFields(input, userWriteFields), username },
        }),
        "Paperless-ngx user create response",
      ),
    };
  },

  async update_user(context, input) {
    const id = encodePaperlessId(input.id, "id");
    const body = requirePaperlessUpdateFields(pickProvidedFields(input, userWriteFields));
    return {
      user: requiredResponseRecord(
        await context.request({ method: "PATCH", path: `/api/users/${id}/`, body }),
        "Paperless-ngx user update response",
      ),
    };
  },

  async delete_user(context, input) {
    const id = encodePaperlessId(input.id, "id");
    await context.request({ method: "DELETE", path: `/api/users/${id}/`, expectJson: false });
    return deletedResult({ id: Number(id) });
  },

  async deactivate_user_totp(context, input) {
    const id = encodePaperlessId(input.id, "id");
    const deactivated = paperlessResponseBoolean(
      await context.request({ method: "POST", path: `/api/users/${id}/deactivate_totp/` }),
      "Paperless-ngx deactivate TOTP response",
    );
    return { deactivated };
  },

  async list_groups(context, input) {
    return normalizePaperlessPage(
      await context.request({
        path: "/api/groups/",
        query: buildListQuery(input, groupFilterFields),
      }),
      "Paperless-ngx groups response",
    );
  },

  async get_group(context, input) {
    const id = encodePaperlessId(input.id, "id");
    return {
      group: requiredResponseRecord(
        await context.request({ path: `/api/groups/${id}/` }),
        "Paperless-ngx group response",
      ),
    };
  },

  async create_group(context, input) {
    const name = requirePaperlessInputString(input.name, "name");
    const permissions = Array.isArray(input.permissions) ? input.permissions : [];
    return {
      group: requiredResponseRecord(
        await context.request({
          method: "POST",
          path: "/api/groups/",
          body: { name, permissions },
        }),
        "Paperless-ngx group create response",
      ),
    };
  },

  async update_group(context, input) {
    const id = encodePaperlessId(input.id, "id");
    const body = requirePaperlessUpdateFields(pickProvidedFields(input, groupWriteFields));
    return {
      group: requiredResponseRecord(
        await context.request({ method: "PATCH", path: `/api/groups/${id}/`, body }),
        "Paperless-ngx group update response",
      ),
    };
  },

  async delete_group(context, input) {
    const id = encodePaperlessId(input.id, "id");
    await context.request({ method: "DELETE", path: `/api/groups/${id}/`, expectJson: false });
    return deletedResult({ id: Number(id) });
  },

  async get_profile(context) {
    return requiredResponseRecord(await context.request({ path: "/api/profile/" }), "Paperless-ngx profile response");
  },

  async update_profile(context, input) {
    const body = requirePaperlessUpdateFields(pickProvidedFields(input, profileWriteFields));
    return requiredResponseRecord(
      await context.request({ method: "PATCH", path: "/api/profile/", body }),
      "Paperless-ngx profile update response",
    );
  },
};
