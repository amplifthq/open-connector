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
  readAppleAdsId,
  readPagination,
  readResultCollection,
  requestAppleAds,
  resolveAdAccountId,
  resourcePath,
} from "./runtime-helpers.ts";

const changeHistoryPath = "/v1/change-history";
const changeSummaryLabel = "Apple Ads change history summary";
const changeDetailLabel = "Apple Ads change history detail";

export const appleAdsChangeHistoryHandlers: AppleAdsHandlers = {
  async query_change_history(input, context) {
    const filters = looseArray(input.filters);
    if (!filters.some((item) => recordOrEmpty(item).field === "eventTime")) {
      throw new ProviderRequestError(400, "filters must include one condition on eventTime.");
    }
    const { payload } = await requestAppleAds(context, {
      method: "POST",
      path: `${changeHistoryPath}/query`,
      adAccountId: resolveAdAccountId(input, context),
      body: compactObject({
        filters,
        sorting: readNonEmptyArray(input.sorting),
        pagination: readAuditPagination(input),
        options: readAuditOptions(input),
      }),
    });

    return {
      changeSummaries: readResultCollection(payload, changeSummaryLabel),
      pagination: readPagination(payload),
    };
  },

  async get_change_history_detail(input, context) {
    const { payload } = await requestAppleAds(context, {
      path: resourcePath(changeHistoryPath, readAppleAdsId(input.detailId, "detailId")),
      adAccountId: resolveAdAccountId(input, context),
      query: {
        limit: readCountParameter(input.limit),
        offset: readCountParameter(input.offset),
      },
    });

    return {
      changeDetails: readResultCollection(payload, changeDetailLabel),
      pagination: readPagination(payload),
    };
  },
};

function readNonEmptyArray(value: unknown): unknown[] | undefined {
  const items = looseArray(value);
  return items.length > 0 ? items : undefined;
}

function readAuditPagination(input: Record<string, unknown>): Record<string, unknown> | undefined {
  const pagination = compactObject({
    offset: optionalInteger(input.offset),
    pageSize: optionalInteger(input.pageSize),
  });
  return Object.keys(pagination).length > 0 ? pagination : undefined;
}

function readAuditOptions(input: Record<string, unknown>): Record<string, unknown> | undefined {
  const options = compactObject({
    needTotals: booleanString(input.needTotals),
    timeZone: optionalString(input.timeZone),
    metadata: optionalString(input.metadata),
  });
  return Object.keys(options).length > 0 ? options : undefined;
}

function readCountParameter(value: unknown): string | undefined {
  const count = optionalInteger(value);
  return count === undefined ? undefined : String(count);
}
