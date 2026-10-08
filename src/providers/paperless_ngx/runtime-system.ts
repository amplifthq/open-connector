import type { PaperlessExecutionContext, PaperlessHandlerMap } from "./runtime-helpers.ts";

import { requiredStringArray } from "../../core/cast.ts";
import { optionalInteger, requiredRecord } from "../../core/cast.ts";
import { providerResponseError } from "../provider-runtime.ts";
import { providerInputError, ProviderRequestError, requiredResponseRecord } from "../provider-runtime.ts";
import { paperlessResponseObjectArray } from "./runtime-helpers.ts";
import { encodePaperlessId, requirePaperlessInputString } from "./runtime-helpers.ts";

async function fetchApplicationConfig(context: PaperlessExecutionContext): Promise<Record<string, unknown>> {
  const configs = paperlessResponseObjectArray(
    await context.request({ path: "/api/config/" }),
    "Paperless-ngx application configuration response",
  );
  const config = configs[0];
  if (!config) {
    throw new ProviderRequestError(
      502,
      "Paperless-ngx returned no application configuration",
      undefined,
      "provider_error",
    );
  }
  return config;
}

export const paperlessNgxSystemActionHandlers: PaperlessHandlerMap = {
  async get_statistics(context) {
    return requiredResponseRecord(
      await context.request({ path: "/api/statistics/" }),
      "Paperless-ngx statistics response",
    );
  },

  async get_system_status(context) {
    return requiredResponseRecord(
      await context.request({ path: "/api/status/" }),
      "Paperless-ngx system status response",
    );
  },

  async get_remote_version(context) {
    return requiredResponseRecord(
      await context.request({ path: "/api/remote_version/" }),
      "Paperless-ngx remote version response",
    );
  },

  async get_ui_settings(context) {
    return requiredResponseRecord(
      await context.request({ path: "/api/ui_settings/" }),
      "Paperless-ngx UI settings response",
    );
  },

  async update_ui_settings(context, input) {
    const result = requiredResponseRecord(
      await context.request({
        method: "POST",
        path: "/api/ui_settings/",
        body: { settings: input.settings },
      }),
      "Paperless-ngx UI settings update response",
    );
    return { success: result.success === true };
  },

  async get_application_config(context) {
    return fetchApplicationConfig(context);
  },

  async update_application_config(context, input) {
    const values = requiredRecord(input.values, "values", providerInputError);
    if ("app_logo" in values) {
      throw new ProviderRequestError(
        400,
        "app_logo cannot be changed through update_application_config",
        undefined,
        "invalid_input",
      );
    }
    if (Object.keys(values).length === 0) {
      throw new ProviderRequestError(400, "values must contain at least one field", undefined, "invalid_input");
    }
    const providedId = optionalInteger(input.id);
    const configId =
      providedId === undefined
        ? encodePaperlessId((await fetchApplicationConfig(context)).id, "config id")
        : encodePaperlessId(providedId, "id");
    const config = requiredResponseRecord(
      await context.request({
        method: "PATCH",
        path: `/api/config/${configId}/`,
        body: values,
      }),
      "Paperless-ngx application configuration update response",
    );
    return config;
  },

  async list_logs(context) {
    return {
      logs: requiredStringArray(
        await context.request({ path: "/api/logs/" }),
        "Paperless-ngx logs response",
        providerResponseError,
      ),
    };
  },

  async get_log(context, input) {
    const name = requirePaperlessInputString(input.name, "name");
    return {
      lines: requiredStringArray(
        await context.request({
          path: `/api/logs/${encodeURIComponent(name)}/`,
          query: { limit: optionalInteger(input.limit) },
        }),
        "Paperless-ngx log response",
        providerResponseError,
      ),
    };
  },

  async global_search(context, input) {
    const query = requirePaperlessInputString(input.query, "query");
    return requiredResponseRecord(
      await context.request({
        path: "/api/search/",
        query: { query, db_only: input.db_only === true ? true : undefined },
      }),
      "Paperless-ngx global search response",
    );
  },

  async autocomplete_search(context, input) {
    const term = requirePaperlessInputString(input.term, "term");
    return {
      terms: requiredStringArray(
        await context.request({
          path: "/api/search/autocomplete/",
          query: { term, limit: optionalInteger(input.limit) },
        }),
        "Paperless-ngx autocomplete response",
        providerResponseError,
      ),
    };
  },
};
