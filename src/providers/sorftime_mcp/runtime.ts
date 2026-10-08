import { optionalRecord, optionalString } from "../../core/cast.ts";
import { providerInputError, requiredInputString } from "../provider-runtime.ts";

export const sorftimeMcpEndpoint = "https://mcp.sorftime.com/";

const metrics: Record<string, string> = {
  sales_volume: "SalesVolume",
  sales_amount: "SalesAmount",
  price: "Price",
  rank: "Rank",
  subcategory_rank: "BsrRank",
  reviews: "Reviews",
  rating: "Star",
};
const matches: Record<string, string> = {
  semantic: "Defualt",
  all_words: "TitleContainAll",
  any_word: "TitleContainOne",
  exact: "ExactTitleMatch",
};

export interface McpCall {
  toolName: string;
  arguments: Record<string, unknown>;
}

const callBuilders: Record<string, (input: Record<string, unknown>) => McpCall> = {
  ali1688_search_products(input) {
    return {
      toolName: "ali1688_similar_product",
      arguments: {
        search_name: input.query,
        page: input.page,
      },
    };
  },
  ali1688_get_product(input) {
    return {
      toolName: "ali1688_product_request",
      arguments: {
        product_id: input.productId,
      },
    };
  },
  ali1688_list_categories(input) {
    return {
      toolName: "ali1688_category_tree",
      arguments: {
        node_id: input.parentId,
      },
    };
  },
  amazon_search_products(input) {
    return {
      toolName: "product_search_from_name",
      arguments: {
        name: input.query,
        page: input.page,
        amz_site: input.site,
      },
    };
  },
  amazon_get_product(input) {
    return {
      toolName: "product_detail",
      arguments: {
        asin: input.productId,
        amz_site: input.site,
      },
    };
  },
  amazon_get_product_trend(input) {
    return {
      toolName: "product_trend",
      arguments: {
        asin: input.productId,
        product_trend_type: metrics[requiredInputString(input.metric, "metric")],
        amz_site: input.site,
      },
    };
  },
  amazon_list_categories(input) {
    return {
      toolName: "category_tree",
      arguments: {
        amz_site: input.site,
        node_id: input.parentId,
      },
    };
  },
  amazon_get_category_report(input) {
    return {
      toolName: "category_report",
      arguments: {
        node_id: input.categoryId,
        amz_site: input.site,
      },
    };
  },
  amazon_list_keywords(input) {
    return {
      toolName: "keyword_list",
      arguments: {
        keyword_support_site: input.site,
        page: input.page,
        rank_min: input.minRank,
        rank_max: input.maxRank,
        search_volume_min: input.minSearchVolume,
        search_volume_max: input.maxSearchVolume,
      },
    };
  },
  amazon_get_keyword(input) {
    return {
      toolName: "keyword_detail",
      arguments: {
        keyword: input.keyword,
        keyword_support_site: input.site,
      },
    };
  },
  amazon_find_related_keywords(input) {
    return {
      toolName: "keyword_extends",
      arguments: {
        keyword: input.keyword,
        keyword_support_site: input.site,
        page: input.page,
      },
    };
  },
  walmart_search_products(input) {
    return {
      toolName: "walmart_product_search_from_name",
      arguments: {
        name: input.query,
        page: input.page,
      },
    };
  },
  walmart_get_product(input) {
    return {
      toolName: "walmart_product_detail_by_product_id",
      arguments: {
        product_id: input.productId,
      },
    };
  },
  walmart_get_product_trend(input) {
    return {
      toolName: "walmart_product_trend_by_product_id",
      arguments: {
        product_id: input.productId,
        trend_type: metrics[requiredInputString(input.metric, "metric")],
        begin_date: input.startDate,
        end_date: input.endDate,
      },
    };
  },
  walmart_list_categories(input) {
    return {
      toolName: "walmart_category_tree",
      arguments: {
        node_id: input.parentId,
      },
    };
  },
  walmart_get_category_report(input) {
    return {
      toolName: "walmart_category_report_by_node_id",
      arguments: {
        node_id: input.categoryId,
      },
    };
  },
  walmart_list_keywords(input) {
    return {
      toolName: "walmart_keyword_list",
      arguments: {
        rank_min: input.minRank,
        rank_max: input.maxRank,
        page: input.page,
      },
    };
  },
  walmart_get_keyword(input) {
    return {
      toolName: "walmart_keyword_detail",
      arguments: {
        keyword: input.keyword,
      },
    };
  },
  walmart_find_related_keywords(input) {
    return {
      toolName: "walmart_keyword_extends",
      arguments: {
        keyword: input.keyword,
        page: input.page,
      },
    };
  },
  shopee_search_products(input) {
    return {
      toolName: "shopee_product_search_from_name",
      arguments: {
        name: input.query,
        site: input.site,
        page: input.page,
      },
    };
  },
  shopee_get_product(input) {
    return {
      toolName: "shopee_product_request",
      arguments: {
        product_id: input.productId,
        site: input.site,
      },
    };
  },
  shopee_get_product_trend(input) {
    return {
      toolName: "shopee_product_trend",
      arguments: {
        product_id: input.productId,
        query_start: input.startDate,
        query_end: input.endDate,
        site: input.site,
      },
    };
  },
  shopee_list_categories(input) {
    return {
      toolName: "shopee_category_tree",
      arguments: {
        site: input.site,
        node_id: input.parentId,
      },
    };
  },
  shopee_list_category_products(input) {
    return {
      toolName: "shopee_category_request",
      arguments: {
        node_id: input.categoryId,
        query_date: input.date,
        page: input.page,
        site: input.site,
      },
    };
  },
  shopee_list_keywords(input) {
    return {
      toolName: "shopee_keyword_search",
      arguments: {
        keyword: input.query,
        rank_min: input.minRank,
        rank_max: input.maxRank,
        search_volume_min: input.minSearchVolume,
        search_volume_max: input.maxSearchVolume,
        page: input.page,
        site: input.site,
      },
    };
  },
  tiktok_search_products(input) {
    return {
      toolName: "tiktok_similar_product",
      arguments: {
        product_name: input.query,
        page: input.page,
        query_type: input.match == null ? undefined : matches[requiredInputString(input.match, "match")],
        site: input.site,
      },
    };
  },
  tiktok_get_product(input) {
    return {
      toolName: "tiktok_product_detail",
      arguments: {
        product_id: input.productId,
        site: input.site,
      },
    };
  },
  tiktok_get_product_trend(input) {
    return {
      toolName: "tiktok_product_trend",
      arguments: {
        product_id: input.productId,
        site: input.site,
      },
    };
  },
  tiktok_list_categories(input) {
    return {
      toolName: "tiktok_category_tree",
      arguments: {
        site: input.site,
        node_id: input.parentId,
      },
    };
  },
  tiktok_get_category_report(input) {
    return {
      toolName: "tiktok_category_report",
      arguments: {
        node_id: input.categoryId,
        site: input.site,
      },
    };
  },
  temu_search_products(input) {
    return {
      toolName: "temu_product_search_from_name",
      arguments: {
        name: input.query,
        site: input.site,
        page: input.page,
      },
    };
  },
  temu_get_product(input) {
    return {
      toolName: "temu_product_request",
      arguments: {
        product_id: input.productId,
        site: input.site,
      },
    };
  },
  temu_get_product_trend(input) {
    return {
      toolName: "temu_product_trend",
      arguments: {
        product_id: input.productId,
        query_start: input.startDate,
        query_end: input.endDate,
        site: input.site,
      },
    };
  },
  temu_list_categories(input) {
    return {
      toolName: "temu_category_tree",
      arguments: {
        site: input.site,
        node_id: input.parentId,
      },
    };
  },
  temu_list_category_products(input) {
    return {
      toolName: "temu_category_request",
      arguments: {
        node_id: input.categoryId,
        page: input.page,
        site: input.site,
      },
    };
  },
};

export function buildSorftimeMcpCall(action: string, input: Record<string, unknown>): McpCall {
  const build = Object.hasOwn(callBuilders, action) ? callBuilders[action] : undefined;
  if (!build) throw providerInputError("Unsupported Sorftime MCP action");
  return build(input);
}

export interface SorftimeMcpResult {
  data: unknown;
  fieldDescriptions: unknown;
  metadata: Record<string, unknown>;
}

export function normalizeSorftimeMcpResult(result: unknown): SorftimeMcpResult {
  const envelope = optionalRecord(result);
  let decoded = result;
  // Sorftime returns JSON in a single text block; preserve multi-block and non-text results.
  if (Array.isArray(envelope?.content) && envelope.content.length === 1) {
    const block = optionalRecord(envelope.content[0]);
    const text = block?.type === "text" ? optionalString(block.text) : undefined;
    if (text !== undefined) {
      try {
        decoded = JSON.parse(text);
      } catch {
        decoded = text;
      }
    }
  }
  const payload = optionalRecord(decoded);
  if (payload && Object.hasOwn(payload, "data")) {
    const { data, doc, ...metadata } = payload;
    return { data, fieldDescriptions: doc ?? null, metadata };
  }
  return { data: decoded, fieldDescriptions: null, metadata: {} };
}
