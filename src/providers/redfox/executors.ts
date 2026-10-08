import type { CredentialValidationResult, ProviderExecutors, ProviderProxyExecutor } from "../../core/types.ts";
import type { ApiKeyProviderContext, ProviderActionHandlers, ProviderActionSources } from "../provider-runtime.ts";

import { compactObject, optionalBoolean, optionalRecord, optionalString } from "../../core/cast.ts";
import {
  defineApiKeyProviderExecutors,
  defineProviderProxy,
  mapProviderActionSources,
  ProviderRequestError,
  providerUserAgent,
} from "../provider-runtime.ts";

const service = "redfox";
const redfoxApiBaseUrl = "https://redfox.hk";
const redfoxValidationPath = "/story/api/gzhData/searchArticle";
const redfoxDefaultSuccessCodes: readonly number[] = [2000];
const redfoxTiktokSuccessCodes: readonly number[] = [2000, 200];

type RedfoxRequestMode = "validate" | "execute";
type RedfoxBody = Record<string, string | number | boolean | undefined>;
type RedfoxActionHandler = (input: Record<string, unknown>, context: ApiKeyProviderContext) => Promise<unknown>;

interface RedfoxEndpoint {
  path: string;
  buildBody(input: Record<string, unknown>): RedfoxBody;
  successCodes?: readonly number[];
  responseMode?: "wrapped" | "direct";
}

const redfoxEndpoints: ProviderActionSources<"redfox", RedfoxEndpoint> = {
  search_douyin_works: {
    path: "/story/api/dyData/searchArticle",
    buildBody: buildSearchBody,
  },
  search_douyin_users: {
    path: "/story/api/dyData/searchUser",
    buildBody: buildSearchBody,
  },
  get_douyin_work: {
    path: "/story/api/dyData/queryWork",
    buildBody(input) {
      return {
        workId: readOptionalString(input.workId),
        workUrl: readOptionalString(input.workUrl),
      };
    },
  },
  get_douyin_user: {
    path: "/story/api/dyData/queryUser",
    buildBody(input) {
      return {
        accountId: readRequiredString(input.accountId, "accountId"),
      };
    },
  },
  list_douyin_user_works: {
    path: "/story/api/dyData/queryWorkList",
    buildBody(input) {
      const accountId = readOptionalString(input.accountId);
      const authorUrl = readOptionalString(input.authorUrl);
      const secUserId = readOptionalString(input.secUserId);

      return {
        accountId,
        authorUrl,
        secUserId,
        offset: readOptionalInteger(input.offset, "offset"),
        sortType: readOptionalString(input.sortType),
      };
    },
  },
  search_douyin_ai_creations: {
    path: "/story/api/parseWork/queryDyAiMsgs",
    buildBody: buildAiCreationSearchBody,
  },
  search_xiaohongshu_works: {
    path: "/story/api/xhs/search/keywordSearchWork",
    responseMode: "direct",
    buildBody(input) {
      return {
        keyword: readRequiredString(input.keyword, "keyword"),
        noteTime: readOptionalString(input.noteTime),
        sort: readOptionalString(input.sort),
        page: readOptionalPositiveInteger(input.page, "page"),
        noteType: readOptionalString(input.noteType),
      };
    },
  },
  search_xiaohongshu_users: {
    path: "/story/api/xhsUser/searchUser",
    buildBody: buildSearchBody,
  },
  get_xiaohongshu_work: {
    path: "/story/api/xhsUser/queryWorkDetail",
    buildBody(input) {
      return {
        workId: readOptionalString(input.workId),
        workLink: readOptionalString(input.workLink),
      };
    },
  },
  get_xiaohongshu_user: {
    path: "/story/api/xhsUser/queryAccountDetail",
    buildBody(input) {
      return {
        accountId: readRequiredString(input.accountId, "accountId"),
        userId: readOptionalString(input.userId),
      };
    },
  },
  search_xiaohongshu_ai_creations: {
    path: "/story/api/parseWork/queryXhsAiMsgs",
    buildBody(input) {
      return {
        keyword: readRequiredString(input.keyword, "keyword"),
        pageNum: readOptionalPositiveInteger(input.pageNum, "pageNum"),
        pageSize: readOptionalPositiveInteger(input.pageSize, "pageSize"),
        source: readOptionalString(input.source),
        startTime: readRequiredString(input.startTime, "startTime"),
        endTime: readRequiredString(input.endTime, "endTime"),
      };
    },
  },
  search_wechat_articles: {
    path: "/story/api/gzhData/searchArticle",
    buildBody: buildSearchBody,
  },
  search_wechat_accounts: {
    path: "/story/api/gzhData/searchUser",
    buildBody: buildSearchBody,
  },
  get_wechat_article: {
    path: "/story/api/gzhData/queryWork",
    buildBody(input) {
      return {
        workUuid: readRequiredString(input.workUuid, "workUuid"),
      };
    },
  },
  get_wechat_article_by_url: {
    path: "/story/api/gzhData/queryArticleDetail",
    buildBody(input) {
      return {
        url: readRequiredString(input.url, "url"),
      };
    },
  },
  get_wechat_account: {
    path: "/story/api/gzhData/queryUser",
    buildBody(input) {
      return {
        account: readRequiredString(input.account, "account"),
        accountName: readOptionalString(input.accountName),
      };
    },
  },
  list_wechat_account_articles: {
    path: "/story/api/gzhData/queryWorkList",
    buildBody(input) {
      return {
        account: readRequiredString(input.account, "account"),
        accountName: readOptionalString(input.accountName),
        offset: readOptionalInteger(input.offset, "offset"),
        sortType: readOptionalString(input.sortType),
        publishTimeStart: readOptionalString(input.publishTimeStart),
        publishTimeEnd: readOptionalString(input.publishTimeEnd),
      };
    },
  },
  search_wechat_ai_creations: {
    path: "/story/api/parseWork/queryAiMsgs",
    buildBody(input) {
      return {
        keyword: readRequiredString(input.keyword, "keyword"),
        pageNum: readRequiredPositiveInteger(input.pageNum, "pageNum"),
        pageSize: readRequiredPositiveInteger(input.pageSize, "pageSize"),
        startTime: readOptionalString(input.startTime),
        endTime: readOptionalString(input.endTime),
      };
    },
  },
  search_bilibili_works: {
    path: "/story/api/bili/data/workSearch",
    buildBody(input) {
      return {
        keyword: readRequiredString(input.keyword, "keyword"),
        exactMatch: optionalBoolean(input.exactMatch),
        page: readRequiredString(input.page, "page"),
        pageSize: readOptionalPositiveInteger(input.pageSize, "pageSize"),
        order: readOptionalString(input.order),
      };
    },
  },
  search_bilibili_users: {
    path: "/story/api/bili/data/accountSearch",
    buildBody(input) {
      return {
        keyword: readRequiredString(input.keyword, "keyword"),
        page: readRequiredString(input.page, "page"),
        pageSize: readOptionalPositiveInteger(input.pageSize, "pageSize"),
        order: readOptionalString(input.order),
      };
    },
  },
  get_bilibili_work: {
    path: "/story/api/bili/data/workDetail",
    buildBody(input) {
      return {
        bvId: readOptionalString(input.bvId),
        workUrl: readOptionalString(input.workUrl),
      };
    },
  },
  get_bilibili_user: {
    path: "/story/api/bili/data/accountDetail",
    buildBody(input) {
      return { mid: readRequiredString(input.mid, "mid") };
    },
  },
  list_bilibili_user_works: {
    path: "/story/api/bili/data/accountWorkList",
    buildBody(input) {
      const mid = readOptionalString(input.mid);
      const accountUrl = readOptionalString(input.accountUrl);
      return {
        mid,
        accountUrl,
        page: readOptionalPositiveInteger(input.page, "page"),
        pageSize: readOptionalPositiveInteger(input.pageSize, "pageSize"),
        order: readOptionalString(input.order),
      };
    },
  },
  search_wechat_channel_works: {
    path: "/story/api/sphAllData/searchWork",
    buildBody(input) {
      return {
        keyword: readRequiredString(input.keyword, "keyword"),
        sort: readOptionalString(input.sort),
        page: readOptionalPositiveInteger(input.page, "page"),
        size: readOptionalPositiveInteger(input.size, "size"),
        exactMatch: optionalBoolean(input.exactMatch),
      };
    },
  },
  search_wechat_channel_users: {
    path: "/story/api/sphAllData/searchUser",
    buildBody(input) {
      return buildAccountNameSearchBody(input);
    },
  },
  get_wechat_channel_work: {
    path: "/story/api/sphAllData/queryWorkDetail",
    buildBody(input) {
      return { videoId: readRequiredString(input.videoId, "videoId") };
    },
  },
  list_wechat_channel_user_works: {
    path: "/story/api/sphAllData/queryWorkList",
    buildBody(input) {
      return {
        nickname: readRequiredString(input.nickname, "nickname"),
        page: readOptionalPositiveInteger(input.page, "page"),
        size: readOptionalPositiveInteger(input.size, "size"),
      };
    },
  },
  search_kuaishou_works: {
    path: "/story/api/ksAllData/searchWork",
    buildBody(input) {
      return {
        keyword: readRequiredString(input.keyword, "keyword"),
        page: readOptionalPositiveInteger(input.page, "page"),
        size: readOptionalPositiveInteger(input.size, "size"),
        sort: readOptionalString(input.sort),
      };
    },
  },
  search_kuaishou_users: {
    path: "/story/api/ksAllData/searchUser",
    buildBody: buildAccountNameSearchBody,
  },
  get_kuaishou_work: {
    path: "/story/api/ksAllData/queryWorkDetail",
    buildBody(input) {
      return { photoId: readRequiredString(input.photoId, "photoId") };
    },
  },
  list_kuaishou_user_works: {
    path: "/story/api/ksAllData/queryWorkList",
    buildBody(input) {
      const kwaiId = readOptionalString(input.kwaiId);
      const threeXId = readOptionalString(input.threeXId);
      return {
        kwaiId,
        threeXId,
        page: readOptionalPositiveInteger(input.page, "page"),
        size: readOptionalPositiveInteger(input.size, "size"),
      };
    },
  },
  search_toutiao_works: {
    path: "/story/api/toutiao/searchWork",
    buildBody(input) {
      return {
        keyword: readRequiredString(input.keyword, "keyword"),
        offset: readRequiredString(input.offset, "offset"),
      };
    },
  },
  search_toutiao_users: {
    path: "/story/api/toutiao/searchAccount",
    responseMode: "direct",
    buildBody(input) {
      return {
        name: readRequiredString(input.name, "name"),
        offset: readOptionalString(input.offset),
        searchId: readOptionalString(input.searchId),
      };
    },
  },
  get_toutiao_work: {
    path: "/story/api/toutiao/workDetail",
    buildBody(input) {
      return { opusId: readRequiredString(input.opusId, "opusId") };
    },
  },
  list_toutiao_work_comments: {
    path: "/story/api/toutiao/workComment",
    responseMode: "direct",
    buildBody(input) {
      return {
        opusId: readRequiredString(input.opusId, "opusId"),
        offset: readOptionalString(input.offset),
      };
    },
  },
  list_toutiao_user_works: {
    path: "/story/api/toutiao/userWorkList",
    buildBody(input) {
      return {
        category: readRequiredString(input.category, "category"),
        token: readRequiredString(input.token, "token"),
        offset: readRequiredString(input.offset, "offset"),
      };
    },
  },
  search_tiktok_users: {
    path: "/story/api/deepSearch/tk/searchUser",
    successCodes: redfoxTiktokSuccessCodes,
    buildBody(input) {
      return {
        keyword: readRequiredString(input.keyword, "keyword"),
        cursor: readRequiredNonNegativeInteger(input.cursor, "cursor"),
      };
    },
  },
};

export const redfoxActionHandlers: ProviderActionHandlers<"redfox", RedfoxActionHandler> = mapProviderActionSources(
  service,
  redfoxEndpoints,
  (_actionName, endpoint): RedfoxActionHandler =>
    (input, context) =>
      requestRedfoxJson({
        apiKey: context.apiKey,
        path: endpoint.path,
        body: endpoint.buildBody(input),
        successCodes: endpoint.successCodes,
        responseMode: endpoint.responseMode,
        context,
        mode: "execute",
      }),
);

export const executors: ProviderExecutors = defineApiKeyProviderExecutors(service, redfoxActionHandlers);

export const credentialValidators = {
  async apiKey(
    input: { apiKey: string; values: Record<string, string> },
    options: { fetcher: typeof fetch; signal?: AbortSignal },
  ): Promise<CredentialValidationResult> {
    await requestRedfoxJson({
      apiKey: input.apiKey,
      path: redfoxValidationPath,
      body: { keyword: "test", offset: 0, sortType: "_0" },
      context: { fetcher: options.fetcher, signal: options.signal },
      mode: "validate",
    });
    return {
      profile: {
        accountId: "redfox-api-key",
        displayName: "RedFoxHub API Key",
        grantedScopes: [],
      },
      grantedScopes: [],
      metadata: {
        apiBaseUrl: redfoxApiBaseUrl,
        validationEndpoint: redfoxValidationPath,
      },
    };
  },
};

async function requestRedfoxJson(input: {
  apiKey: string;
  path: string;
  body: RedfoxBody;
  successCodes?: readonly number[];
  responseMode?: "wrapped" | "direct";
  context: Pick<ApiKeyProviderContext, "fetcher" | "signal">;
  mode: RedfoxRequestMode;
}): Promise<unknown> {
  let response: Response;
  let payload: unknown;

  try {
    response = await input.context.fetcher(new URL(input.path, redfoxApiBaseUrl), {
      method: "POST",
      headers: redfoxHeaders(input.apiKey),
      body: JSON.stringify(compactObject(input.body)),
      signal: input.context.signal,
    });
    payload = await readRedfoxJson(response);
  } catch (error) {
    if (error instanceof ProviderRequestError) {
      throw error;
    }
    throw new ProviderRequestError(
      502,
      error instanceof Error ? `RedFoxHub request failed: ${error.message}` : "RedFoxHub request failed",
    );
  }

  if (!response.ok) {
    throw createRedfoxHttpError(response.status, payload, input.mode);
  }

  if (input.responseMode === "direct" && !hasRedfoxBusinessCode(payload))
    return { code: 2000, msg: "成功", data: payload };

  const normalized = normalizeRedfoxPayload(payload);
  if (!isRedfoxSuccessCode(normalized.code, input.successCodes)) {
    throw createRedfoxBusinessError(normalized, input.mode);
  }

  return normalized;
}

function hasRedfoxBusinessCode(payload: unknown): boolean {
  const record = optionalRecord(payload);
  return record != null && "code" in record;
}

function isRedfoxSuccessCode(code: number, successCodes = redfoxDefaultSuccessCodes): boolean {
  return successCodes.includes(code);
}

function redfoxHeaders(apiKey: string): Record<string, string> {
  return {
    accept: "application/json",
    "content-type": "application/json",
    REDFOX_API_KEY: apiKey,
    "user-agent": providerUserAgent,
  };
}

async function readRedfoxJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.trim() === "") {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ProviderRequestError(502, "RedFoxHub returned invalid JSON");
  }
}

function normalizeRedfoxPayload(payload: unknown): { code: number; msg: string; data: unknown } {
  const record = optionalRecord(payload);
  if (!record) {
    throw new ProviderRequestError(502, "RedFoxHub returned an invalid response");
  }
  return {
    code: readCode(record.code),
    msg: optionalString(record.msg) ?? "",
    data: record.data,
  };
}

function readCode(value: unknown): number {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isInteger(parsed)) {
      return parsed;
    }
  }
  throw new ProviderRequestError(502, "RedFoxHub response did not include code");
}

function createRedfoxHttpError(status: number, payload: unknown, mode: RedfoxRequestMode): ProviderRequestError {
  const message = extractRedfoxMessage(payload) ?? `RedFoxHub request failed with ${status || 500}`;
  return mapRedfoxStatus(status, message, mode);
}

function createRedfoxBusinessError(
  payload: { code: number; msg: string },
  mode: RedfoxRequestMode,
): ProviderRequestError {
  const message = payload.msg || `RedFoxHub returned business code ${payload.code}`;
  return mapRedfoxStatus(payload.code, message, mode, 502);
}

function mapRedfoxStatus(status: number, message: string, mode: RedfoxRequestMode, fallbackStatus = status || 500) {
  if (status === 429) {
    return new ProviderRequestError(429, message);
  }
  if (mode === "validate" && (status === 401 || status === 403)) {
    return new ProviderRequestError(401, message);
  }
  if (mode === "execute" && (status === 401 || status === 403)) {
    return new ProviderRequestError(401, message);
  }
  if ([400, 404, 422].includes(status)) {
    return new ProviderRequestError(400, message);
  }
  return new ProviderRequestError(fallbackStatus >= 500 ? 502 : fallbackStatus, message);
}

function extractRedfoxMessage(payload: unknown): string | undefined {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }
  const record = optionalRecord(payload);
  if (!record) {
    return undefined;
  }
  return optionalString(record.msg) ?? optionalString(record.message) ?? optionalString(record.error);
}

function buildSearchBody(input: Record<string, unknown>): RedfoxBody {
  return {
    keyword: readRequiredString(input.keyword, "keyword"),
    offset: readOptionalInteger(input.offset, "offset"),
    sortType: readOptionalString(input.sortType),
  };
}

function buildAiCreationSearchBody(input: Record<string, unknown>): RedfoxBody {
  return {
    keyword: readRequiredString(input.keyword, "keyword"),
    pageNum: readOptionalPositiveInteger(input.pageNum, "pageNum"),
    pageSize: readOptionalPositiveInteger(input.pageSize, "pageSize"),
    startTime: readOptionalString(input.startTime),
    endTime: readOptionalString(input.endTime),
  };
}

function buildAccountNameSearchBody(input: Record<string, unknown>): RedfoxBody {
  return {
    accountName: readRequiredString(input.accountName, "accountName"),
    page: readOptionalPositiveInteger(input.page, "page"),
    pageSize: readOptionalPositiveInteger(input.pageSize, "pageSize"),
  };
}

function readRequiredString(value: unknown, fieldName: string): string {
  const result = readOptionalString(value);
  if (result === undefined) {
    throw new ProviderRequestError(400, `${fieldName} is required`);
  }
  return result;
}

export const proxy: ProviderProxyExecutor = defineProviderProxy({
  service,
  baseUrl: "https://redfox.hk",
  auth: { type: "api_key_header", name: "redfox_api_key" },
});

function readOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function readOptionalInteger(value: unknown, fieldName: string): number | undefined {
  if (value == null || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new ProviderRequestError(400, `${fieldName} must be a non-negative integer`);
  }
  return parsed;
}

function readRequiredNonNegativeInteger(value: unknown, fieldName: string): number {
  const result = readOptionalInteger(value, fieldName);
  if (result === undefined) {
    throw new ProviderRequestError(400, `${fieldName} is required`);
  }
  return result;
}

function readOptionalPositiveInteger(value: unknown, fieldName: string): number | undefined {
  if (value == null || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ProviderRequestError(400, `${fieldName} must be a positive integer`);
  }
  return parsed;
}

function readRequiredPositiveInteger(value: unknown, fieldName: string): number {
  const result = readOptionalPositiveInteger(value, fieldName);
  if (result === undefined) {
    throw new ProviderRequestError(400, `${fieldName} is required`);
  }
  return result;
}
