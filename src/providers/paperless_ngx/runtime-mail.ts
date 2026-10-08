import type { PaperlessExecutionContext, PaperlessHandlerMap, PaperlessQueryValue } from "./runtime-helpers.ts";

import { looseArray, optionalBoolean, optionalInteger, optionalRecord, optionalString } from "../../core/cast.ts";
import { ProviderRequestError, requiredResponseRecord } from "../provider-runtime.ts";
import {
  deletedResult,
  encodePaperlessId,
  normalizePaperlessPage,
  pickProvidedFields,
  requirePaperlessUpdateFields,
} from "./runtime-helpers.ts";

const mailAccountFields = [
  "name",
  "imap_server",
  "imap_port",
  "imap_security",
  "username",
  "password",
  "character_set",
  "is_token",
  "account_type",
  "expiration",
  "owner",
  "set_permissions",
];

const mailAccountTestFields = [
  "id",
  "imap_server",
  "imap_port",
  "imap_security",
  "username",
  "password",
  "character_set",
  "is_token",
  "account_type",
  "expiration",
];

const mailRuleFields = [
  "name",
  "account",
  "folder",
  "filter_from",
  "filter_to",
  "filter_subject",
  "filter_body",
  "filter_attachment_filename_include",
  "filter_attachment_filename_exclude",
  "maximum_age",
  "action",
  "action_parameter",
  "assign_title_from",
  "assign_tags",
  "assign_correspondent_from",
  "assign_correspondent",
  "assign_document_type",
  "assign_owner_from_rule",
  "order",
  "attachment_type",
  "consumption_scope",
  "pdf_layout",
  "enabled",
  "stop_processing",
  "owner",
  "set_permissions",
];

const mailActionsRequiringParameter = new Set([2, 5]);

function assertMailRuleActionParameter(body: Record<string, unknown>): void {
  const action = optionalInteger(body.action);
  if (action === undefined || !mailActionsRequiringParameter.has(action)) return;
  if (!optionalString(body.action_parameter)?.trim()) {
    throw new ProviderRequestError(
      400,
      "action_parameter is required in the same request when action is 2 (move) or 5 (tag)",
      undefined,
      "invalid_input",
    );
  }
}

function buildListQuery(
  input: Record<string, unknown>,
  modeled: Record<string, PaperlessQueryValue>,
): Record<string, PaperlessQueryValue> {
  const additional = (optionalRecord(input.additional_filters) ?? {}) as Record<string, PaperlessQueryValue>;
  return {
    page: optionalInteger(input.page),
    page_size: optionalInteger(input.page_size),
    ...modeled,
    ...additional,
  };
}

async function fetchOwnedObject(
  context: PaperlessExecutionContext,
  path: string,
  input: Record<string, unknown>,
  label: string,
): Promise<Record<string, unknown>> {
  return requiredResponseRecord(
    await context.request({ path, query: { full_perms: optionalBoolean(input.full_perms) } }),
    label,
  );
}

export const paperlessNgxMailActionHandlers: PaperlessHandlerMap = {
  async list_mail_accounts(context, input) {
    return normalizePaperlessPage(
      await context.request({
        path: "/api/mail_accounts/",
        query: buildListQuery(input, { full_perms: optionalBoolean(input.full_perms) }),
      }),
      "Paperless-ngx mail account list response",
    );
  },

  async get_mail_account(context, input) {
    const id = encodePaperlessId(input.id, "id");
    return fetchOwnedObject(context, `/api/mail_accounts/${id}/`, input, "Paperless-ngx mail account response");
  },

  async create_mail_account(context, input) {
    return requiredResponseRecord(
      await context.request({
        method: "POST",
        path: "/api/mail_accounts/",
        body: pickProvidedFields(input, mailAccountFields),
      }),
      "Paperless-ngx mail account create response",
    );
  },

  async update_mail_account(context, input) {
    const id = encodePaperlessId(input.id, "id");
    return requiredResponseRecord(
      await context.request({
        method: "PATCH",
        path: `/api/mail_accounts/${id}/`,
        body: requirePaperlessUpdateFields(pickProvidedFields(input, mailAccountFields)),
      }),
      "Paperless-ngx mail account update response",
    );
  },

  async delete_mail_account(context, input) {
    const id = encodePaperlessId(input.id, "id");
    await context.request({
      method: "DELETE",
      path: `/api/mail_accounts/${id}/`,
      expectJson: false,
    });
    return deletedResult({ id: Number(id) });
  },

  async test_mail_account(context, input) {
    const result = requiredResponseRecord(
      await context.request({
        method: "POST",
        path: "/api/mail_accounts/test/",
        body: pickProvidedFields(input, mailAccountTestFields),
      }),
      "Paperless-ngx mail account test response",
    );
    return { success: result.success === true };
  },

  async process_mail_account(context, input) {
    const id = encodePaperlessId(input.id, "id");
    return requiredResponseRecord(
      await context.request({ method: "POST", path: `/api/mail_accounts/${id}/process/` }),
      "Paperless-ngx mail account process response",
    );
  },
  async list_mail_rules(context, input) {
    return normalizePaperlessPage(
      await context.request({
        path: "/api/mail_rules/",
        query: buildListQuery(input, { full_perms: optionalBoolean(input.full_perms) }),
      }),
      "Paperless-ngx mail rule list response",
    );
  },

  async get_mail_rule(context, input) {
    const id = encodePaperlessId(input.id, "id");
    return fetchOwnedObject(context, `/api/mail_rules/${id}/`, input, "Paperless-ngx mail rule response");
  },

  async create_mail_rule(context, input) {
    const body = pickProvidedFields(input, mailRuleFields);
    assertMailRuleActionParameter(body);
    return requiredResponseRecord(
      await context.request({ method: "POST", path: "/api/mail_rules/", body }),
      "Paperless-ngx mail rule create response",
    );
  },

  async update_mail_rule(context, input) {
    const id = encodePaperlessId(input.id, "id");
    const body = requirePaperlessUpdateFields(pickProvidedFields(input, mailRuleFields));
    assertMailRuleActionParameter(body);
    return requiredResponseRecord(
      await context.request({ method: "PATCH", path: `/api/mail_rules/${id}/`, body }),
      "Paperless-ngx mail rule update response",
    );
  },

  async delete_mail_rule(context, input) {
    const id = encodePaperlessId(input.id, "id");
    await context.request({ method: "DELETE", path: `/api/mail_rules/${id}/`, expectJson: false });
    return deletedResult({ id: Number(id) });
  },
  async list_processed_mail(context, input) {
    return normalizePaperlessPage(
      await context.request({
        path: "/api/processed_mail/",
        query: buildListQuery(input, {
          ordering: optionalString(input.ordering),
          rule: optionalInteger(input.rule),
          status: optionalString(input.status),
        }),
      }),
      "Paperless-ngx processed mail list response",
    );
  },

  async get_processed_mail(context, input) {
    const id = encodePaperlessId(input.id, "id");
    return requiredResponseRecord(
      await context.request({ path: `/api/processed_mail/${id}/` }),
      "Paperless-ngx processed mail response",
    );
  },

  async bulk_delete_processed_mail(context, input) {
    const mailIds = looseArray(input.mail_ids);
    if (mailIds.length === 0) {
      throw new ProviderRequestError(400, "mail_ids must contain at least one id", undefined, "invalid_input");
    }
    return requiredResponseRecord(
      await context.request({
        method: "POST",
        path: "/api/processed_mail/bulk_delete/",
        body: { mail_ids: mailIds },
      }),
      "Paperless-ngx processed mail bulk delete response",
    );
  },
};
