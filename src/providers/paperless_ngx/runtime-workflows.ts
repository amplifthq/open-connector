import type { PaperlessExecutionContext, PaperlessHandlerMap } from "./runtime-helpers.ts";

import { requiredResponseRecord } from "../provider-runtime.ts";
import {
  buildPaperlessListQuery,
  deletedResult,
  encodePaperlessId,
  normalizePaperlessPage,
  pickProvidedFields,
  requirePaperlessUpdateFields,
} from "./runtime-helpers.ts";

const workflowWriteFields = ["name", "order", "enabled", "triggers", "actions"];

const workflowTriggerWriteFields = [
  "type",
  "sources",
  "filter_path",
  "filter_filename",
  "filter_mailrule",
  "matching_algorithm",
  "match",
  "is_insensitive",
  "filter_has_tags",
  "filter_has_all_tags",
  "filter_has_not_tags",
  "filter_custom_field_query",
  "filter_has_any_correspondents",
  "filter_has_not_correspondents",
  "filter_has_any_document_types",
  "filter_has_not_document_types",
  "filter_has_any_storage_paths",
  "filter_has_not_storage_paths",
  "filter_has_correspondent",
  "filter_has_document_type",
  "filter_has_storage_path",
  "schedule_offset_days",
  "schedule_is_recurring",
  "schedule_recurring_interval_days",
  "schedule_date_field",
  "schedule_date_custom_field",
];

const workflowActionWriteFields = [
  "type",
  "assign_title",
  "assign_tags",
  "assign_correspondent",
  "assign_document_type",
  "assign_storage_path",
  "assign_owner",
  "assign_view_users",
  "assign_view_groups",
  "assign_change_users",
  "assign_change_groups",
  "assign_custom_fields",
  "assign_custom_fields_values",
  "remove_all_tags",
  "remove_tags",
  "remove_all_correspondents",
  "remove_correspondents",
  "remove_all_document_types",
  "remove_document_types",
  "remove_all_storage_paths",
  "remove_storage_paths",
  "remove_custom_fields",
  "remove_all_custom_fields",
  "remove_all_owners",
  "remove_owners",
  "remove_all_permissions",
  "remove_view_users",
  "remove_view_groups",
  "remove_change_users",
  "remove_change_groups",
  "email",
  "webhook",
  "passwords",
  "ai_suggestion_fields",
  "ai_create_missing",
  "ai_overwrite_existing",
];

interface WorkflowResource {
  collectionPath: string;
  label: string;
  writeFields: readonly string[];
}

const workflowResource: WorkflowResource = {
  collectionPath: "/api/workflows/",
  label: "Paperless-ngx workflow",
  writeFields: workflowWriteFields,
};

const workflowTriggerResource: WorkflowResource = {
  collectionPath: "/api/workflow_triggers/",
  label: "Paperless-ngx workflow trigger",
  writeFields: workflowTriggerWriteFields,
};

const workflowActionResource: WorkflowResource = {
  collectionPath: "/api/workflow_actions/",
  label: "Paperless-ngx workflow action",
  writeFields: workflowActionWriteFields,
};

async function listResource(
  context: PaperlessExecutionContext,
  resource: WorkflowResource,
  input: Record<string, unknown>,
) {
  return normalizePaperlessPage(
    await context.request({ path: resource.collectionPath, query: buildPaperlessListQuery(input) }),
    `${resource.label} list response`,
  );
}

async function getResource(
  context: PaperlessExecutionContext,
  resource: WorkflowResource,
  input: Record<string, unknown>,
) {
  const id = encodePaperlessId(input.id, "id");
  return requiredResponseRecord(
    await context.request({ path: `${resource.collectionPath}${id}/` }),
    `${resource.label} response`,
  );
}

async function createResource(
  context: PaperlessExecutionContext,
  resource: WorkflowResource,
  input: Record<string, unknown>,
) {
  return requiredResponseRecord(
    await context.request({
      method: "POST",
      path: resource.collectionPath,
      body: pickProvidedFields(input, resource.writeFields),
    }),
    `${resource.label} create response`,
  );
}

async function updateResource(
  context: PaperlessExecutionContext,
  resource: WorkflowResource,
  input: Record<string, unknown>,
) {
  const id = encodePaperlessId(input.id, "id");
  const body = requirePaperlessUpdateFields(pickProvidedFields(input, resource.writeFields));
  return requiredResponseRecord(
    await context.request({ method: "PATCH", path: `${resource.collectionPath}${id}/`, body }),
    `${resource.label} update response`,
  );
}

async function deleteResource(
  context: PaperlessExecutionContext,
  resource: WorkflowResource,
  input: Record<string, unknown>,
) {
  const id = encodePaperlessId(input.id, "id");
  await context.request({
    method: "DELETE",
    path: `${resource.collectionPath}${id}/`,
    expectJson: false,
  });
  return deletedResult({ id: Number(id) });
}

export const paperlessNgxWorkflowActionHandlers: PaperlessHandlerMap = {
  list_workflows: (context, input) => listResource(context, workflowResource, input),
  get_workflow: (context, input) => getResource(context, workflowResource, input),
  create_workflow: (context, input) => createResource(context, workflowResource, input),
  update_workflow: (context, input) => updateResource(context, workflowResource, input),
  delete_workflow: (context, input) => deleteResource(context, workflowResource, input),

  list_workflow_triggers: (context, input) => listResource(context, workflowTriggerResource, input),
  get_workflow_trigger: (context, input) => getResource(context, workflowTriggerResource, input),
  create_workflow_trigger: (context, input) => createResource(context, workflowTriggerResource, input),
  update_workflow_trigger: (context, input) => updateResource(context, workflowTriggerResource, input),
  delete_workflow_trigger: (context, input) => deleteResource(context, workflowTriggerResource, input),

  list_workflow_actions: (context, input) => listResource(context, workflowActionResource, input),
  get_workflow_action: (context, input) => getResource(context, workflowActionResource, input),
  create_workflow_action: (context, input) => createResource(context, workflowActionResource, input),
  update_workflow_action: (context, input) => updateResource(context, workflowActionResource, input),
  delete_workflow_action: (context, input) => deleteResource(context, workflowActionResource, input),
};
