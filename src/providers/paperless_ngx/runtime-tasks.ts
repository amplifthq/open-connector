import type { PaperlessHandlerMap, PaperlessQueryValue } from "./runtime-helpers.ts";

import { requiredString } from "../../core/cast.ts";
import { looseArray, optionalInteger, optionalRecord } from "../../core/cast.ts";
import { providerResponseError } from "../provider-runtime.ts";
import { ProviderRequestError, requiredResponseRecord } from "../provider-runtime.ts";
import { paperlessResponseObjectArray } from "./runtime-helpers.ts";
import { paperlessResponseInteger } from "./runtime-helpers.ts";
import {
  encodePaperlessId,
  normalizePaperlessPage,
  pickProvidedFields,
  requirePaperlessInputString,
} from "./runtime-helpers.ts";

const pageQueryFields = ["page", "page_size", "ordering"];

const taskFilterFields = [
  "task_id",
  "name",
  "result",
  "task_type",
  "trigger_source",
  "acknowledged",
  "owner",
  "date_created_after",
  "date_created_before",
];

const taskStatusFilterFields = ["status", "is_complete"];

function buildTaskQuery(
  input: Record<string, unknown>,
  fields: readonly string[],
): Record<string, PaperlessQueryValue> {
  return {
    ...(pickProvidedFields(input, fields) as Record<string, PaperlessQueryValue>),
    ...((optionalRecord(input.additional_filters) ?? {}) as Record<string, PaperlessQueryValue>),
  };
}

export const paperlessNgxTaskActionHandlers: PaperlessHandlerMap = {
  async list_tasks(context, input) {
    return normalizePaperlessPage(
      await context.request({
        path: "/api/tasks/",
        query: buildTaskQuery(input, [...pageQueryFields, ...taskFilterFields, ...taskStatusFilterFields]),
      }),
      "Paperless-ngx tasks response",
    );
  },

  async get_task(context, input) {
    const taskId = requirePaperlessInputString(input.task_id, "task_id");
    const page = normalizePaperlessPage(
      await context.request({ path: "/api/tasks/", query: { task_id: taskId } }),
      "Paperless-ngx tasks response",
    );
    const results = looseArray(page.results);
    if (results.length === 0) {
      throw new ProviderRequestError(
        404,
        `Paperless-ngx task ${taskId} was not found or is not visible to the connected user`,
        undefined,
        "invalid_input",
      );
    }
    return requiredResponseRecord(results[0], "Paperless-ngx task");
  },

  async get_task_by_id(context, input) {
    const id = encodePaperlessId(input.id, "id");
    return requiredResponseRecord(await context.request({ path: `/api/tasks/${id}/` }), "Paperless-ngx task response");
  },

  async acknowledge_tasks(context, input) {
    const all = input.all === true;
    const tasks = Array.isArray(input.tasks) ? input.tasks : undefined;
    if (all && tasks !== undefined) {
      throw new ProviderRequestError(400, "Set either all or tasks, not both", undefined, "invalid_input");
    }
    if (!all && (!tasks || tasks.length === 0)) {
      throw new ProviderRequestError(400, "tasks is required unless all is true", undefined, "invalid_input");
    }
    const response = requiredResponseRecord(
      await context.request({
        method: "POST",
        path: "/api/tasks/acknowledge/",
        body: all ? { all: true } : { tasks },
      }),
      "Paperless-ngx acknowledge tasks response",
    );
    return {
      result: paperlessResponseInteger(response.result, "Paperless-ngx acknowledge tasks result"),
    };
  },

  async get_task_summary(context, input) {
    return {
      summary: paperlessResponseObjectArray(
        await context.request({
          path: "/api/tasks/summary/",
          query: { days: optionalInteger(input.days) },
        }),
        "Paperless-ngx task summary response",
      ),
    };
  },

  async get_task_status_counts(context, input) {
    return requiredResponseRecord(
      await context.request({
        path: "/api/tasks/status_counts/",
        query: buildTaskQuery(input, taskFilterFields),
      }),
      "Paperless-ngx task status counts response",
    );
  },

  async list_active_tasks(context) {
    return {
      tasks: paperlessResponseObjectArray(
        await context.request({ path: "/api/tasks/active/" }),
        "Paperless-ngx active tasks response",
      ),
    };
  },

  async run_task(context, input) {
    const taskType = requirePaperlessInputString(input.task_type, "task_type");
    const response = requiredResponseRecord(
      await context.request({
        method: "POST",
        path: "/api/tasks/run/",
        body: { task_type: taskType },
      }),
      "Paperless-ngx run task response",
    );
    return { task_id: requiredString(response.task_id, "Paperless-ngx run task id", providerResponseError) };
  },
};
