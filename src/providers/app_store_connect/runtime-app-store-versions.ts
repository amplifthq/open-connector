import type { AppStoreConnectHandlers } from "./runtime-helpers.ts";

import { pickOptionalString } from "../../core/cast.ts";
import {
  listResources,
  normalizeResource,
  readAppStoreConnectId,
  readResource,
  requestAppStoreConnect,
  resourcePath,
} from "./runtime-helpers.ts";

export const appStoreConnectAppStoreVersionHandlers: AppStoreConnectHandlers = {
  async list_app_store_versions(input, context) {
    const page = await listResources(context, input, {
      path: resourcePath("/v1/apps", readAppStoreConnectId(input.appId, "appId"), "appStoreVersions"),
      label: "App Store Connect version list",
      query: {
        "filter[platform]": pickOptionalString(input, "platform"),
        "filter[versionString]": pickOptionalString(input, "versionString"),
        "filter[appVersionState]": pickOptionalString(input, "appVersionState"),
      },
    });
    return {
      appStoreVersions: page.resources.map(normalizeAppStoreVersion),
      nextCursor: page.nextCursor,
      total: page.total,
    };
  },

  async get_app_store_version(input, context) {
    const { payload } = await requestAppStoreConnect(context, {
      path: resourcePath("/v1/appStoreVersions", readAppStoreConnectId(input.appStoreVersionId, "appStoreVersionId")),
    });
    return {
      appStoreVersion: normalizeAppStoreVersion(readResource(payload, "App Store Connect version")),
    };
  },
};

export function normalizeAppStoreVersion(resource: Record<string, unknown>): Record<string, unknown> {
  const version = normalizeResource(resource, "App Store Connect version");
  delete version.appStoreState;
  delete version.usesIdfa;
  return version;
}
