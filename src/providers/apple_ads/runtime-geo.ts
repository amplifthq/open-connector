import type { AppleAdsHandlers } from "./runtime-helpers.ts";

import {
  booleanString,
  compactObject,
  looseArray,
  optionalInteger,
  optionalString,
  recordOrEmpty,
} from "../../core/cast.ts";
import { ProviderRequestError } from "../provider-runtime.ts";
import {
  createAppleAdsResource,
  deleteAppleAdsResource,
  getAppleAdsResource,
  queryAppleAds,
  readAppleAdsId,
  readOptionalAppleAdsId,
  readPagination,
  readResultCollection,
  requestAppleAds,
  requireAnyAttribute,
  resolveAdAccountId,
  resourcePath,
  updateAppleAdsResource,
} from "./runtime-helpers.ts";

const geoSearchPath = "/v1/search/geo";
const locationsPath = "/v1/locations";
const locationGroupsPath = "/v1/location-groups";
const geoLocationLabel = "Apple Ads geo location";
const locationLabel = "Apple Ads location";
const locationGroupLabel = "Apple Ads location group";

export const appleAdsGeoHandlers: AppleAdsHandlers = {
  async query_geo_locations(input, context) {
    const { payload } = await requestAppleAds(context, {
      method: "POST",
      path: geoSearchPath,
      adAccountId: resolveAdAccountId(input, context),
      body: compactObject({
        geoRequest: readGeoRequests(input.geoRequest),
        supplySource: input.supplySource,
        pagination: readGeoPagination(input),
      }),
    });
    return {
      geoLocations: readResultCollection(payload, geoLocationLabel),
      pagination: readPagination(payload),
    };
  },

  async search_geo_locations(input, context) {
    const { payload } = await requestAppleAds(context, {
      path: geoSearchPath,
      adAccountId: resolveAdAccountId(input, context),
      query: {
        supplySource: optionalString(input.supplySource),
        query: optionalString(input.query),
        entity: optionalString(input.entity),
        countrycode: optionalString(input.countryCode),
        eligible: booleanString(input.eligible),
        offset: readQueryNumber(input.offset),
        pageSize: readQueryNumber(input.pageSize),
      },
    });
    return {
      geoLocations: readResultCollection(payload, geoLocationLabel),
      pagination: readPagination(payload),
    };
  },

  async query_locations(input, context) {
    const page = await queryAppleAds(context, input, {
      path: `${locationsPath}/query`,
      label: locationLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { locations: page.items, pagination: page.pagination };
  },

  async get_location(input, context) {
    return {
      location: await getAppleAdsResource(context, {
        path: resourcePath(locationsPath, readAppleAdsId(input.locationId, "locationId")),
        label: locationLabel,
        adAccountId: resolveAdAccountId(input, context),
      }),
    };
  },

  async create_location_group(input, context) {
    const groupItems = input.groupType === "STATIC" ? looseArray(input.locationIds) : looseArray(input.rules);
    if (groupItems.length === 0) {
      throw new ProviderRequestError(
        400,
        input.groupType === "STATIC"
          ? "A STATIC location group needs at least one entry in locationIds."
          : "A DYNAMIC location group needs at least one entry in rules.",
      );
    }
    const adAccountId = resolveAdAccountId(input, context);
    return {
      locationGroup: await createAppleAdsResource(context, {
        path: locationGroupsPath,
        label: locationGroupLabel,
        adAccountId,
        body: compactObject({
          name: input.name,
          brandId: readAppleAdsId(input.brandId, "brandId"),
          adAccountId,
          groupType: input.groupType,
          rules: input.rules,
          locationIds: readLocationIds(input.locationIds),
          description: input.description,
        }),
      }),
    };
  },

  async query_location_groups(input, context) {
    const page = await queryAppleAds(context, input, {
      path: `${locationGroupsPath}/query`,
      label: locationGroupLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { locationGroups: page.items, pagination: page.pagination };
  },

  async get_location_group(input, context) {
    return {
      locationGroup: await getAppleAdsResource(context, {
        path: resourcePath(locationGroupsPath, readAppleAdsId(input.locationGroupId, "locationGroupId")),
        label: locationGroupLabel,
        adAccountId: resolveAdAccountId(input, context),
      }),
    };
  },

  async update_location_group(input, context) {
    const body = compactObject({
      name: input.name,
      groupType: input.groupType,
      rules: input.rules,
      locationIds: readLocationIds(input.locationIds),
      description: input.description,
    });
    requireAnyAttribute(body, "update_location_group requires at least one field to change besides locationGroupId");

    return {
      locationGroup: await updateAppleAdsResource(context, {
        path: resourcePath(locationGroupsPath, readAppleAdsId(input.locationGroupId, "locationGroupId")),
        label: locationGroupLabel,
        adAccountId: resolveAdAccountId(input, context),
        body,
      }),
    };
  },

  async delete_location_group(input, context) {
    const locationGroupId = readAppleAdsId(input.locationGroupId, "locationGroupId");
    await deleteAppleAdsResource(context, {
      path: resourcePath(locationGroupsPath, locationGroupId),
      label: locationGroupLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { id: locationGroupId, deleted: true };
  },
};

function readGeoRequests(value: unknown): Array<Record<string, unknown>> {
  return looseArray(value).map((item) => {
    const entry = recordOrEmpty(item);
    if ((entry.id === undefined) === (entry.legacyId === undefined)) {
      throw new ProviderRequestError(400, "Each geoRequest entry needs exactly one of id or legacyId.");
    }
    return compactObject({
      id: readOptionalAppleAdsId(entry.id, "geoRequest[].id"),
      legacyId: entry.legacyId,
      entity: entry.entity,
    });
  });
}

function readGeoPagination(input: Record<string, unknown>): Record<string, unknown> | undefined {
  const pagination = compactObject({
    offset: optionalInteger(input.offset),
    pageSize: optionalInteger(input.pageSize),
  });
  return Object.keys(pagination).length > 0 ? pagination : undefined;
}

function readLocationIds(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.map((item) => readAppleAdsId(item, "locationIds[]"));
}

function readQueryNumber(value: unknown): string | undefined {
  const parsed = optionalInteger(value);
  return parsed === undefined ? undefined : String(parsed);
}
