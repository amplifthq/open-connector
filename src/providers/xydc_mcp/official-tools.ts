import type { JsonSchema } from "../../core/types.ts";

import { s } from "../../core/json-schema.ts";

interface ActionFollowUp {
  actionId: string;
  description: string;
  recommended?: boolean;
}
type ActionOperationType = "read" | "write" | "destructive";
const strictObject = (
  description: string,
  properties: Record<string, JsonSchema>,
  options?: { required?: string[]; optional?: string[] },
): JsonSchema => s.object(description, properties, options ?? { required: Object.keys(properties) });

interface XydcMcpToolDefinition {
  name: string;
  description: string;
  operationType: ActionOperationType;
  inputSchema: JsonSchema;
  outputSchema: JsonSchema;
  followUpActions: ActionFollowUp[];
}

// Complete tool set from the officially verified tools/list response on 2026-09-10.
export const xydcMcpToolDefinitions: readonly XydcMcpToolDefinition[] = [
  {
    name: "generate_category_insight_resource",
    description:
      "Generate a category insight resource for a user-confirmed marketplace and category. XYDC waits up to five minutes and rebuilds failed resources internally. Each independent successful call costs 500 Credits, including existing-resource hits. Reuse resourceId for subsequent queries; do not blindly retry. Connector waits at most 55 seconds for generation. A timeout does not confirm upstream cancellation or prevent charges; the result may be unknown. Do not automatically retry generation after a timeout. Read xydc_mcp.read_category_insight_guide before the first category insight task.",
    operationType: "write",
    inputSchema: strictObject(
      "Tool input.",
      {
        categoryId: {
          description: "The category ID confirmed by the user.",
          minLength: 1,
          type: "string",
        },
        country: {
          description:
            "The Amazon marketplace explicitly selected by the user, such as US, UK or DE. Do not assume a marketplace.",
          minLength: 1,
          type: "string",
        },
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["country", "categoryId"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          description: "Structured MCP content when available; otherwise the original MCP content envelope.",
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [
      {
        actionId: "xydc_mcp.read_category_insight_guide",
        description: "Read the official category insight workflow and resource reuse guidance.",
      },
    ],
  },
  {
    name: "get_asin_ad_change_trends",
    description:
      "Get daily newly observed advertising campaigns for one ASIN. This does not establish whether existing campaigns stopped, decreased, were deleted or remain active. Use traffic trends for traffic changes.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        asin: { description: "ASIN.", type: "string" },
        country: { description: "Marketplace country code.", type: "string" },
        end_date: { description: "End date in YYYY-MM-DD format.", type: "string" },
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        start_date: { description: "Start date in YYYY-MM-DD format.", type: "string" },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["asin", "start_date", "end_date", "country"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_asin_bsr_trends",
    description:
      "Get daily BSR category-ranking trends for one ASIN. Supports US, CA, MX, BR, UK, DE, FR, ES, IT and JP; this is not keyword ranking.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        asin: { description: "ASIN.", type: "string" },
        country: { description: "Marketplace country code.", type: "string" },
        end_date: { description: "End date in YYYY-MM-DD format.", type: "string" },
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        start_date: { description: "Start date in YYYY-MM-DD format.", type: "string" },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["asin", "start_date", "end_date", "country"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_asin_info",
    description:
      "Get product titles, prices, currencies, star ratings, rating counts, images and Amazon links for up to 100 ASINs sharing one marketplace.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        asins: {
          description: "Up to 100 ASINs sharing the same country. Split larger requests into batches.",
          items: { type: "string", description: "One asins item value." },
          type: "array",
          maxItems: 100,
        },
        country: { description: "Marketplace country code, such as US, UK or DE.", type: "string" },
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["asins", "country"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_asin_info_change_trends",
    description:
      "Get daily changes to one ASIN title and main image, including current and previous values. Use get_asin_info_trends for prices, ratings and promotions.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        asin: { description: "ASIN.", type: "string" },
        country: { description: "Marketplace country code.", type: "string" },
        end_date: { description: "End date in YYYY-MM-DD format.", type: "string" },
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        start_date: { description: "Start date in YYYY-MM-DD format.", type: "string" },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["asin", "start_date", "end_date", "country"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_asin_info_trends",
    description:
      "Get daily rating counts, stars, displayed/list/deal/Prime prices, coupons, promotions and subscription offers for one ASIN. Longer date ranges cost more.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        asin: { description: "ASIN.", type: "string" },
        country: { description: "Marketplace country code.", type: "string" },
        end_date: { description: "End date in YYYY-MM-DD format.", type: "string" },
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        start_date: { description: "Start date in YYYY-MM-DD format.", type: "string" },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["asin", "start_date", "end_date", "country"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_asin_keyword_count_trends",
    description:
      "Get daily keyword counts and distributions for ASINs sharing one marketplace. Covers organic/advertising, ranking bands, head/long-tail and acquisition-rate groups. Keyword-count growth does not prove traffic growth.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        asins: {
          description: "ASINs sharing a single marketplace; per-ASIN countries are not supported.",
          items: { type: "string", description: "One asins item value." },
          type: "array",
        },
        country: { description: "Marketplace country code shared by all ASINs.", type: "string" },
        end_date: { description: "End date in YYYY-MM-DD format.", type: "string" },
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        start_date: { description: "Start date in YYYY-MM-DD format.", type: "string" },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["asins", "country", "start_date", "end_date"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_asin_keyword_rank_hourly",
    description:
      "Get hourly rankings of one ASIN for one keyword on one day. Supports US, UK and DE; use daily trends for multiple days.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        asin: { description: "ASIN.", type: "string" },
        country: {
          description: "Marketplace country code.",
          type: "string",
          enum: ["US", "UK", "DE"],
        },
        date: { description: "Date in YYYY-MM-DD format.", type: "string" },
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        keyword: { description: "Keyword.", type: "string" },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["asin", "keyword", "date", "country"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_asin_keyword_rank_trends",
    description: "Get daily rankings of one ASIN for one keyword over a date range.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        asin: { description: "ASIN.", type: "string" },
        country: { description: "Marketplace country code.", type: "string" },
        end_date: { description: "End date in YYYY-MM-DD format.", type: "string" },
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        keyword: { description: "Keyword.", type: "string" },
        start_date: { description: "Start date in YYYY-MM-DD format.", type: "string" },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["asin", "keyword", "start_date", "end_date", "country"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_asin_keyword_traffic_trends",
    description: "Get daily organic, advertising and placement-level traffic for one ASIN and keyword.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        asin: { description: "ASIN.", type: "string" },
        country: { description: "Marketplace country code.", type: "string" },
        end_date: { description: "End date in YYYY-MM-DD format.", type: "string" },
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        keyword: { description: "Keyword.", type: "string" },
        start_date: { description: "Start date in YYYY-MM-DD format.", type: "string" },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["asin", "keyword", "start_date", "end_date", "country"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_asin_keywords",
    description:
      "Reverse-search keywords bringing rankings and traffic to one ASIN in the latest seven-day snapshot. Use daily or monthly tools for historical dates.",
    operationType: "read",
    inputSchema: Object.assign(
      strictObject(
        "Tool input.",
        {
          asin: { description: "ASIN.", type: "string" },
          country: { description: "Marketplace country code.", type: "string" },
          intent_summary: {
            description:
              "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
            type: "string",
          },
          page: {
            default: 1,
            description: "Page number starting at 1. Default: 1.",
            type: "integer",
            minimum: 1,
          },
          page_size: {
            default: 20,
            description: "Page size from 1 to 10000. Default: 20. A size of 10000 only supports page 1.",
            type: "integer",
            minimum: 1,
            maximum: 10000,
          },
          sort_field: {
            description:
              "Sort field. Default: traffic. Supports traffic, trafficAcquisitionRate, advertisingTraffic, advertisingTrafficAcquisitionRate, organicTraffic, organicTrafficAcquisitionRate, spRank and orRank.",
            type: "string",
          },
          sort_order: {
            description: "Sort direction: asc or desc. Default: desc.",
            type: "string",
            enum: ["asc", "desc"],
          },
          user_task: {
            description:
              "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
            type: "string",
          },
        },
        { required: ["asin", "country"] },
      ),
      {
        allOf: [
          {
            if: { properties: { page_size: { const: 10000 } }, required: ["page_size"] },
            then: { properties: { page: { const: 1 } } },
          },
        ],
      },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_asin_keywords_daily",
    description: "Get historical daily reverse-search keywords, rankings and traffic for one ASIN over a date range.",
    operationType: "read",
    inputSchema: Object.assign(
      strictObject(
        "Tool input.",
        {
          asin: { description: "ASIN.", type: "string" },
          country: { description: "Marketplace country code.", type: "string" },
          end_date: { description: "End date in YYYY-MM-DD format.", type: "string" },
          intent_summary: {
            description:
              "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
            type: "string",
          },
          page: {
            default: 1,
            description: "Page number starting at 1. Default: 1.",
            type: "integer",
            minimum: 1,
          },
          page_size: {
            default: 20,
            description: "Page size from 1 to 10000. Default: 20. A size of 10000 only supports page 1.",
            type: "integer",
            minimum: 1,
            maximum: 10000,
          },
          sort_field: {
            description:
              "Sort field. Default: traffic. Supports traffic, trafficAcquisitionRate, advertisingTraffic, advertisingTrafficAcquisitionRate, organicTraffic, organicTrafficAcquisitionRate, spRank and orRank.",
            type: "string",
          },
          sort_order: {
            description: "Sort direction: asc or desc. Default: desc.",
            type: "string",
            enum: ["asc", "desc"],
          },
          start_date: { description: "Start date in YYYY-MM-DD format.", type: "string" },
          user_task: {
            description:
              "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
            type: "string",
          },
        },
        { required: ["asin", "start_date", "end_date", "country"] },
      ),
      {
        allOf: [
          {
            if: { properties: { page_size: { const: 10000 } }, required: ["page_size"] },
            then: { properties: { page: { const: 1 } } },
          },
        ],
      },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_asin_keywords_monthly",
    description:
      "Get historical monthly reverse-search keywords, rankings and traffic for one ASIN over a month range.",
    operationType: "read",
    inputSchema: Object.assign(
      strictObject(
        "Tool input.",
        {
          asin: { description: "ASIN.", type: "string" },
          country: { description: "Marketplace country code.", type: "string" },
          end_month: { description: "End month in YYYY-MM format.", type: "string" },
          intent_summary: {
            description:
              "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
            type: "string",
          },
          page: {
            default: 1,
            description: "Page number starting at 1. Default: 1.",
            type: "integer",
            minimum: 1,
          },
          page_size: {
            default: 20,
            description: "Page size from 1 to 10000. Default: 20. A size of 10000 only supports page 1.",
            type: "integer",
            minimum: 1,
            maximum: 10000,
          },
          sort_field: {
            description:
              "Sort field. Default: traffic. Supports traffic, trafficAcquisitionRate, advertisingTraffic, advertisingTrafficAcquisitionRate, organicTraffic, organicTrafficAcquisitionRate, spRank and orRank.",
            type: "string",
          },
          sort_order: {
            description: "Sort direction: asc or desc. Default: desc.",
            type: "string",
            enum: ["asc", "desc"],
          },
          start_month: { description: "Start month in YYYY-MM format.", type: "string" },
          user_task: {
            description:
              "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
            type: "string",
          },
        },
        { required: ["asin", "start_month", "end_month", "country"] },
      ),
      {
        allOf: [
          {
            if: { properties: { page_size: { const: 10000 } }, required: ["page_size"] },
            then: { properties: { page: { const: 1 } } },
          },
        ],
      },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_asin_order_trends",
    description:
      "Get monthly order counts for one ASIN over an explicit month range. Use get_asin_orders_last_30_days for recent orders.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        asin: { description: "ASIN.", type: "string" },
        country: { description: "Marketplace country code.", type: "string" },
        end_month: { description: "End month in YYYY-MM format.", type: "string" },
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        start_month: { description: "Start month in YYYY-MM format.", type: "string" },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["asin", "start_month", "end_month", "country"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_asin_orders_last_30_days",
    description: "Get recent order counts for one or more ASINs, measured over the last 30 days.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        asins: {
          description: "Up to 100 ASINs sharing the same country. Split larger requests into batches.",
          items: { type: "string", description: "One asins item value." },
          type: "array",
          maxItems: 100,
        },
        country: { description: "Marketplace country code, such as US, UK or DE.", type: "string" },
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["asins", "country"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_asin_traffic",
    description:
      "Get the latest seven-day organic, advertising and total traffic scores and period-over-period changes for one or more ASINs.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        asins: {
          description: "ASIN list.",
          items: { type: "string", description: "One asins item value." },
          type: "array",
        },
        country: { description: "Marketplace country code, such as US, UK or DE.", type: "string" },
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["asins", "country"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_asin_traffic_trends",
    description: "Get daily organic, advertising and placement-level traffic-score trends for one ASIN.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        asin: { description: "ASIN.", type: "string" },
        country: { description: "Marketplace country code.", type: "string" },
        end_date: { description: "End date in YYYY-MM-DD format.", type: "string" },
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        start_date: { description: "Start date in YYYY-MM-DD format.", type: "string" },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["asin", "start_date", "end_date", "country"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_asin_traffic_trends_monthly",
    description: "Get monthly organic, advertising and placement-level traffic-score trends for one ASIN.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        asin: { description: "ASIN.", type: "string" },
        country: { description: "Marketplace country code.", type: "string" },
        end_month: { description: "End month in YYYY-MM format.", type: "string" },
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        start_month: { description: "Start month in YYYY-MM format.", type: "string" },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["asin", "start_month", "end_month", "country"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_asin_traffic_trends_weekly",
    description:
      "Get weekly organic, advertising and placement-level traffic-score trends for one ASIN. Weeks run Monday through Sunday.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        asin: { description: "ASIN.", type: "string" },
        country: { description: "Marketplace country code, such as US, UK or DE.", type: "string" },
        end_week: {
          description:
            "Any date in the final week, in YYYY-MM-DD format; expanded to Sunday. Weeks run Monday through Sunday.",
          type: "string",
        },
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        start_week: {
          description:
            "Any date in the first week, in YYYY-MM-DD format; expanded to Monday. Weeks run Monday through Sunday.",
          type: "string",
        },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["asin", "start_week", "end_week", "country"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_asin_variations",
    description: "Get the parent ASIN, child ASINs and variation attributes for one ASIN.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        asin: { description: "ASIN.", type: "string" },
        country: { description: "Marketplace country code.", type: "string" },
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["asin", "country"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_category_brand_market_size",
    description:
      "Get category brand market-size lists and complete trends, with monthly or last-30-day periods, price bands, rankings, sorting and pagination. Costs 5 Credits per 5 returned brands. newRelease sorts by descending sales and does not filter new brands; rankingType overrides orders. Read xydc_mcp.read_category_insight_guide before the first category insight task.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        categoryId: {
          description: "The category ID confirmed by the user.",
          minLength: 1,
          type: "string",
        },
        country: {
          description:
            "The Amazon marketplace explicitly selected by the user, such as US, UK or DE. Do not assume a marketplace.",
          minLength: 1,
          type: "string",
        },
        cycleFilter: strictObject(
          "Monthly or last 30 days only. Monthly requires startDate, defaults cycle to monthly and allows an endDate in the same month. Alternatively use period=last30days without dates and cycle omitted or daily. Dates use the marketplace time zone.",
          {
            cycle: {
              enum: ["monthly", "daily"],
              type: "string",
              description: "Calendar aggregation cycle.",
            },
            endDate: {
              description: "End date in YYYY-MM-DD format.",
              minLength: 1,
              type: "string",
            },
            period: {
              enum: ["last30days"],
              type: "string",
              description: "Rolling reporting period, used instead of explicit dates.",
            },
            startDate: {
              description: "Start date in YYYY-MM-DD format.",
              minLength: 1,
              type: "string",
            },
          },
          { required: [] },
        ),
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        orders: {
          description: "At most one order when rankingType is absent. Ignored when rankingType is provided.",
          items: strictObject(
            "One orders item value.",
            {
              direction: { enum: ["asc", "desc"], type: "string", description: "Sort direction." },
              field: {
                enum: ["sales", "salesRevenue", "salesRatio", "price", "stars"],
                type: "string",
                description: "Field to sort by.",
              },
            },
            { required: ["field", "direction"] },
          ),
          type: "array",
        },
        page: {
          default: 1,
          minimum: 1,
          type: "integer",
          description: "Page number starting at 1.",
        },
        pageSize: {
          default: 20,
          minimum: 1,
          type: "integer",
          description: "Number of records per page.",
        },
        priceType: {
          default: "allPrice",
          enum: ["allPrice", "lowPrice", "midPrice", "highPrice"],
          type: "string",
          description: "Price band to query.",
        },
        rankingType: {
          description:
            "For this brand endpoint, newRelease means descending sales, not a new-brand filter. Providing rankingType overrides orders.",
          enum: ["sales", "salesRevenue", "surge", "newRelease"],
          type: "string",
        },
        resourceId: {
          description: "A usable resource ID returned by resource generation. Reuse it throughout the same task.",
          minLength: 1,
          type: "string",
        },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["country", "categoryId", "resourceId", "cycleFilter"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          description: "Structured MCP content when available; otherwise the original MCP content envelope.",
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [
      {
        actionId: "xydc_mcp.read_category_insight_guide",
        description: "Read the official category insight workflow and resource reuse guidance.",
      },
    ],
  },
  {
    name: "get_category_brand_sales_trends",
    description:
      "Get complete historical monthly sales trends and existing last-30-day summaries for specified brands; month-range filtering is unsupported. Cost: ceil((maximum historical months + 1) / 6) times requested brand count times 2 Credits. Read xydc_mcp.read_category_insight_guide before the first category insight task.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        brands: {
          items: { description: "Brand name.", minLength: 1, type: "string" },
          minItems: 1,
          type: "array",
          description: "Brand names to include.",
        },
        categoryId: {
          description: "The category ID confirmed by the user.",
          minLength: 1,
          type: "string",
        },
        country: {
          description:
            "The Amazon marketplace explicitly selected by the user, such as US, UK or DE. Do not assume a marketplace.",
          minLength: 1,
          type: "string",
        },
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        priceType: {
          default: "allPrice",
          enum: ["allPrice", "lowPrice", "midPrice", "highPrice"],
          type: "string",
          description: "Price band to query.",
        },
        resourceId: {
          description: "A usable resource ID returned by resource generation. Reuse it throughout the same task.",
          minLength: 1,
          type: "string",
        },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["country", "categoryId", "resourceId", "brands"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          description: "Structured MCP content when available; otherwise the original MCP content envelope.",
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [
      {
        actionId: "xydc_mcp.read_category_insight_guide",
        description: "Read the official category insight workflow and resource reuse guidance.",
      },
    ],
  },
  {
    name: "get_category_keyword_analysis",
    description:
      "Get category keyword summary, distribution and complete trends for one calendar month and an explicit correlationType. Omit the month for the latest available keyword month. Costs 5 Credits including trends; yearly, daily and rolling periods are unsupported. Read xydc_mcp.read_category_insight_guide before the first category insight task.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        categoryId: {
          description: "The category ID confirmed by the user.",
          minLength: 1,
          type: "string",
        },
        correlationType: {
          enum: ["high", "medium", "low"],
          type: "string",
          description: "Keyword relevance level.",
        },
        country: {
          description:
            "The Amazon marketplace explicitly selected by the user, such as US, UK or DE. Do not assume a marketplace.",
          minLength: 1,
          type: "string",
        },
        cycleFilter: strictObject(
          "One calendar month only. Omit cycleFilter or startDate for the latest available keyword month in this marketplace; an explicit month cannot be later. cycle defaults to monthly. endDate requires an explicit startDate in the same month and does not restrict individual days. Rolling periods are unsupported. Included trends cover the full history. Dates use the marketplace time zone.",
          {
            cycle: {
              enum: ["monthly"],
              type: "string",
              description: "Calendar aggregation cycle.",
            },
            endDate: {
              description: "End date in YYYY-MM-DD format.",
              minLength: 1,
              type: "string",
            },
            startDate: {
              description: "Start date in YYYY-MM-DD format.",
              minLength: 1,
              type: "string",
            },
          },
          { required: [] },
        ),
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        resourceId: {
          description: "A usable resource ID returned by resource generation. Reuse it throughout the same task.",
          minLength: 1,
          type: "string",
        },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["country", "categoryId", "resourceId", "correlationType"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          description: "Structured MCP content when available; otherwise the original MCP content envelope.",
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [
      {
        actionId: "xydc_mcp.read_category_insight_guide",
        description: "Read the official category insight workflow and resource reuse guidance.",
      },
    ],
  },
  {
    name: "get_category_keywords",
    description:
      "Get category keywords for one calendar month, with correlation, brand, range, text and pagination filters. Omit the month for the latest available keyword month. Includes full historical trends unless includeTrend=false. Costs 1 Credit per 20 keywords. Read xydc_mcp.read_category_insight_guide before the first category insight task.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        categoryId: {
          description: "The category ID confirmed by the user.",
          minLength: 1,
          type: "string",
        },
        country: {
          description:
            "The Amazon marketplace explicitly selected by the user, such as US, UK or DE. Do not assume a marketplace.",
          minLength: 1,
          type: "string",
        },
        cycleFilter: strictObject(
          "One calendar month only. Omit cycleFilter or startDate for the latest available keyword month in this marketplace; an explicit month cannot be later. cycle defaults to monthly. endDate requires an explicit startDate in the same month and does not restrict individual days. Rolling periods are unsupported. Included trends cover the full history. Dates use the marketplace time zone.",
          {
            cycle: {
              enum: ["monthly"],
              type: "string",
              description: "Calendar aggregation cycle.",
            },
            endDate: {
              description: "End date in YYYY-MM-DD format.",
              minLength: 1,
              type: "string",
            },
            startDate: {
              description: "Start date in YYYY-MM-DD format.",
              minLength: 1,
              type: "string",
            },
          },
          { required: [] },
        ),
        filters: strictObject(
          "Categorical list filters.",
          {
            brands: {
              items: { description: "Brand name.", minLength: 1, type: "string" },
              type: "array",
              description: "Brand names to include.",
            },
            correlationTypes: {
              items: {
                enum: ["high", "medium", "low"],
                type: "string",
                description: "One correlationTypes item value.",
              },
              type: "array",
              description: "Keyword relevance levels to include.",
            },
          },
          { required: [] },
        ),
        includeTrend: {
          default: true,
          type: "boolean",
          description: "Whether to include complete historical trends.",
        },
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        page: {
          default: 1,
          minimum: 1,
          type: "integer",
          description: "Page number starting at 1.",
        },
        pageSize: {
          default: 20,
          minimum: 1,
          type: "integer",
          description: "Number of records per page.",
        },
        query: {
          description: "Optional list search term. Omit to disable text filtering.",
          type: "string",
        },
        rangeFilters: strictObject(
          "Ranges on the same field are ORed; different fields are ANDed. Each range needs at least one bound and min must not exceed max. Put both bounds of a continuous range in the same item. Omitted bounds are unbounded. Inclusion rules are described on each field. All keyword bounds must be nonnegative.",
          {
            adjustedClickConversionRate: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One adjustedClickConversionRate item value.",
                {
                  max: {
                    description:
                      "A nonnegative finite decimal string, such as 0 or 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                  min: {
                    description:
                      "A nonnegative finite decimal string, such as 0 or 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                },
                { required: [] },
              ),
              type: "array",
            },
            cpc: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One cpc item value.",
                {
                  max: {
                    description:
                      "A nonnegative finite decimal string, such as 0 or 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                  min: {
                    description:
                      "A nonnegative finite decimal string, such as 0 or 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                },
                { required: [] },
              ),
              type: "array",
            },
            organicRotationRate: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One organicRotationRate item value.",
                {
                  max: {
                    description:
                      "A nonnegative finite decimal string, such as 0 or 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                  min: {
                    description:
                      "A nonnegative finite decimal string, such as 0 or 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                },
                { required: [] },
              ),
              type: "array",
            },
            searchFrequencyRank: {
              description: "Closed interval [min,max]: includes both bounds.",
              items: strictObject(
                "One searchFrequencyRank item value.",
                {
                  max: { minimum: 0, type: "integer", description: "Upper range bound." },
                  min: { minimum: 0, type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
            searchTermCompetitiveDifficulty: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One searchTermCompetitiveDifficulty item value.",
                {
                  max: { minimum: 0, type: "integer", description: "Upper range bound." },
                  min: { minimum: 0, type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
            searchVolume: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One searchVolume item value.",
                {
                  max: { minimum: 0, type: "integer", description: "Upper range bound." },
                  min: { minimum: 0, type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
          },
          { required: [] },
        ),
        resourceId: {
          description: "A usable resource ID returned by resource generation. Reuse it throughout the same task.",
          minLength: 1,
          type: "string",
        },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["country", "categoryId", "resourceId"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          description: "Structured MCP content when available; otherwise the original MCP content envelope.",
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [
      {
        actionId: "xydc_mcp.read_category_insight_guide",
        description: "Read the official category insight workflow and resource reuse guidance.",
      },
    ],
  },
  {
    name: "get_category_market_size_trends",
    description:
      "Get complete historical monthly category sales trends across all price bands and existing last-30-day summaries. Month-range filtering is unsupported. Costs 5 Credits per 6 historical months; last-30-day summaries add no charge. Read xydc_mcp.read_category_insight_guide before the first category insight task.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        categoryId: {
          description: "The category ID confirmed by the user.",
          minLength: 1,
          type: "string",
        },
        country: {
          description:
            "The Amazon marketplace explicitly selected by the user, such as US, UK or DE. Do not assume a marketplace.",
          minLength: 1,
          type: "string",
        },
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        resourceId: {
          description: "A usable resource ID returned by resource generation. Reuse it throughout the same task.",
          minLength: 1,
          type: "string",
        },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["country", "categoryId", "resourceId"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          description: "Structured MCP content when available; otherwise the original MCP content envelope.",
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [
      {
        actionId: "xydc_mcp.read_category_insight_guide",
        description: "Read the official category insight workflow and resource reuse guidance.",
      },
    ],
  },
  {
    name: "get_category_new_release_opportunity_trends",
    description:
      "Get category new-release opportunity summary, list, full trends and periods. Costs 5 Credits per 6 trend months; lists and periods add no charge. Read xydc_mcp.read_category_insight_guide before the first category insight task.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        categoryId: {
          description: "The category ID confirmed by the user.",
          minLength: 1,
          type: "string",
        },
        country: {
          description:
            "The Amazon marketplace explicitly selected by the user, such as US, UK or DE. Do not assume a marketplace.",
          minLength: 1,
          type: "string",
        },
        cycleFilter: strictObject(
          "Monthly requires startDate and allows an endDate in the same month. Alternatively use period=last30days without dates and cycle omitted or daily.",
          {
            cycle: {
              enum: ["monthly", "daily"],
              type: "string",
              description: "Calendar aggregation cycle.",
            },
            endDate: {
              description: "End date in YYYY-MM-DD format.",
              minLength: 1,
              type: "string",
            },
            period: {
              enum: ["last30days"],
              type: "string",
              description: "Rolling reporting period, used instead of explicit dates.",
            },
            startDate: {
              description: "Start date in YYYY-MM-DD format.",
              minLength: 1,
              type: "string",
            },
          },
          { required: [] },
        ),
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        priceType: {
          default: "allPrice",
          enum: ["allPrice", "lowPrice", "midPrice", "highPrice"],
          type: "string",
          description: "Price band to query.",
        },
        resourceId: {
          description: "A usable resource ID returned by resource generation. Reuse it throughout the same task.",
          minLength: 1,
          type: "string",
        },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["country", "categoryId", "resourceId", "cycleFilter"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          description: "Structured MCP content when available; otherwise the original MCP content envelope.",
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [
      {
        actionId: "xydc_mcp.read_category_insight_guide",
        description: "Read the official category insight workflow and resource reuse guidance.",
      },
    ],
  },
  {
    name: "get_category_new_release_ranking",
    description:
      "Get category new-release rankings for required reportPeriod: YYYY-MM, YYYY, last30days or last12months. Set rangeFilters.streetDays explicitly: there is no default listing-age limit, so unfiltered results are not necessarily new products. Costs 5 Credits per 5 representative ASINs. Read xydc_mcp.read_category_insight_guide before the first category insight task.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        categoryId: {
          description: "The category ID confirmed by the user.",
          minLength: 1,
          type: "string",
        },
        country: {
          description:
            "The Amazon marketplace explicitly selected by the user, such as US, UK or DE. Do not assume a marketplace.",
          minLength: 1,
          type: "string",
        },
        filters: strictObject(
          "Categorical list filters.",
          {
            brands: {
              items: { description: "Brand name.", minLength: 1, type: "string" },
              type: "array",
              description: "Brand names to include.",
            },
          },
          { required: [] },
        ),
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        orders: {
          items: strictObject(
            "One orders item value.",
            {
              direction: { enum: ["asc", "desc"], type: "string", description: "Sort direction." },
              field: {
                enum: [
                  "sales",
                  "revenue",
                  "price",
                  "ratings",
                  "stars",
                  "salesMom",
                  "salesYoy",
                  "trafficScore",
                  "organicTrafficScoreRatio",
                  "height",
                  "length",
                  "width",
                  "weight",
                ],
                type: "string",
                description: "Field to sort by.",
              },
            },
            { required: ["field", "direction"] },
          ),
          type: "array",
          description: "List sorting rules.",
        },
        page: {
          default: 1,
          minimum: 1,
          type: "integer",
          description: "Page number starting at 1.",
        },
        pageSize: {
          default: 20,
          minimum: 1,
          type: "integer",
          description: "Number of records per page.",
        },
        query: {
          description: "Optional list search term. Omit to disable text filtering.",
          type: "string",
        },
        rangeFilters: strictObject(
          "Ranges on the same field are ORed; different fields are ANDed. Each range needs at least one bound and min must not exceed max. Put both bounds of a continuous range in the same item. Omitted bounds are unbounded. Inclusion rules are described on each field. Listing age uses streetDays; there is no legacy streetSince default filter.",
          {
            height: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One height item value.",
                {
                  max: { type: "integer", description: "Upper range bound." },
                  min: { type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
            length: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One length item value.",
                {
                  max: { type: "integer", description: "Upper range bound." },
                  min: { type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
            organicTrafficScoreRatio: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One organicTrafficScoreRatio item value.",
                {
                  max: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                  min: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                },
                { required: [] },
              ),
              type: "array",
            },
            price: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One price item value.",
                {
                  max: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                  min: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                },
                { required: [] },
              ),
              type: "array",
            },
            ratings: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One ratings item value.",
                {
                  max: { type: "integer", description: "Upper range bound." },
                  min: { type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
            revenue: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One revenue item value.",
                {
                  max: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                  min: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                },
                { required: [] },
              ),
              type: "array",
            },
            sales: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One sales item value.",
                {
                  max: { type: "integer", description: "Upper range bound." },
                  min: { type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
            salesMom: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One salesMom item value.",
                {
                  max: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                  min: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                },
                { required: [] },
              ),
              type: "array",
            },
            salesYoy: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One salesYoy item value.",
                {
                  max: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                  min: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                },
                { required: [] },
              ),
              type: "array",
            },
            stars: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One stars item value.",
                {
                  max: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                  min: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                },
                { required: [] },
              ),
              type: "array",
            },
            streetDays: {
              description:
                "Half-open interval [min,max). New-release rankings have no default listing-age cutoff: omitting this filter retains all active candidates. Specify the streetDays range matching the user goal.",
              items: strictObject(
                "One streetDays item value.",
                {
                  max: { type: "integer", description: "Upper range bound." },
                  min: { type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
            trafficScore: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One trafficScore item value.",
                {
                  max: { type: "integer", description: "Upper range bound." },
                  min: { type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
            weight: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One weight item value.",
                {
                  max: { type: "integer", description: "Upper range bound." },
                  min: { type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
            width: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One width item value.",
                {
                  max: { type: "integer", description: "Upper range bound." },
                  min: { type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
          },
          { required: [] },
        ),
        reportPeriod: {
          description:
            "Required reporting period: YYYY-MM for a full calendar month, YYYY for a full calendar year, or last30days / last12months. Uses the marketplace time zone. Daily dates, date ranges and cycleFilter are unsupported. Calendar years always span January 1 through December 31, including the current year.",
          pattern:
            "^((000[1-9]|00[1-9][0-9]|0[1-9][0-9]{2}|[1-9][0-9]{3})(-(0[1-9]|1[0-2]))?|last30days|last12months)$",
          type: "string",
        },
        resourceId: {
          description: "A usable resource ID returned by resource generation. Reuse it throughout the same task.",
          minLength: 1,
          type: "string",
        },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["country", "categoryId", "resourceId", "reportPeriod"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          description: "Structured MCP content when available; otherwise the original MCP content envelope.",
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [
      {
        actionId: "xydc_mcp.read_category_insight_guide",
        description: "Read the official category insight workflow and resource reuse guidance.",
      },
    ],
  },
  {
    name: "get_category_price_segment_trends",
    description:
      "Get low, middle and high price-band analysis and full trends, with period prices, brands, representative ASINs, ratings and subranges. Historical trends do not contain monthly price boundaries. Costs 5 Credits per 6 distinct months across all bands. Read xydc_mcp.read_category_insight_guide before the first category insight task.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        categoryId: {
          description: "The category ID confirmed by the user.",
          minLength: 1,
          type: "string",
        },
        country: {
          description:
            "The Amazon marketplace explicitly selected by the user, such as US, UK or DE. Do not assume a marketplace.",
          minLength: 1,
          type: "string",
        },
        cycleFilter: strictObject(
          "One calendar month with cycle=monthly and both startDate/endDate, or period=last30days without dates.",
          {
            cycle: {
              enum: ["monthly", "daily"],
              type: "string",
              description: "Calendar aggregation cycle.",
            },
            endDate: {
              description: "End date in YYYY-MM-DD format.",
              minLength: 1,
              type: "string",
            },
            period: {
              enum: ["last30days"],
              type: "string",
              description: "Rolling reporting period, used instead of explicit dates.",
            },
            startDate: {
              description: "Start date in YYYY-MM-DD format.",
              minLength: 1,
              type: "string",
            },
          },
          { required: [] },
        ),
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        resourceId: {
          description: "A usable resource ID returned by resource generation. Reuse it throughout the same task.",
          minLength: 1,
          type: "string",
        },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["country", "categoryId", "resourceId", "cycleFilter"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          description: "Structured MCP content when available; otherwise the original MCP content envelope.",
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [
      {
        actionId: "xydc_mcp.read_category_insight_guide",
        description: "Read the official category insight workflow and resource reuse guidance.",
      },
    ],
  },
  {
    name: "get_category_primary_asins",
    description:
      "Get representative ASINs and complete trends for a category or price band, with rankings, sorting and pagination. last12months only supports all price bands. Costs 5 Credits per 5 representative ASINs; rankingType overrides orders. Read xydc_mcp.read_category_insight_guide before the first category insight task.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        categoryId: {
          description: "The category ID confirmed by the user.",
          minLength: 1,
          type: "string",
        },
        country: {
          description:
            "The Amazon marketplace explicitly selected by the user, such as US, UK or DE. Do not assume a marketplace.",
          minLength: 1,
          type: "string",
        },
        cycleFilter: strictObject(
          "Monthly/yearly rankings require cycle=monthly/yearly and startDate/endDate within the same calendar month/year. Alternatively use only period=last30days/last12months. Dates use the marketplace time zone. last12months requires priceType omitted or allPrice. Do not combine last30days with cycle=yearly.",
          {
            cycle: {
              enum: ["monthly", "yearly", "daily"],
              type: "string",
              description: "Calendar aggregation cycle.",
            },
            endDate: {
              description: "End date in YYYY-MM-DD format.",
              minLength: 1,
              type: "string",
            },
            period: {
              enum: ["last30days", "last12months"],
              type: "string",
              description: "Rolling reporting period, used instead of explicit dates.",
            },
            startDate: {
              description: "Start date in YYYY-MM-DD format.",
              minLength: 1,
              type: "string",
            },
          },
          { required: [] },
        ),
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        orders: {
          items: strictObject(
            "One orders item value.",
            {
              direction: { enum: ["asc", "desc"], type: "string", description: "Sort direction." },
              field: {
                enum: ["sales", "salesRevenue", "salesRatio", "price", "stars", "streetDate"],
                type: "string",
                description: "Field to sort by.",
              },
            },
            { required: ["field", "direction"] },
          ),
          type: "array",
          description: "List sorting rules.",
        },
        page: {
          default: 1,
          minimum: 1,
          type: "integer",
          description: "Page number starting at 1.",
        },
        pageSize: {
          default: 20,
          maximum: 10000,
          minimum: 1,
          type: "integer",
          description: "Number of records per page.",
        },
        priceType: {
          default: "allPrice",
          description:
            "For period=last12months, omit priceType or use allPrice; lowPrice, midPrice and highPrice are unsupported.",
          enum: ["allPrice", "lowPrice", "midPrice", "highPrice"],
          type: "string",
        },
        rankingType: {
          enum: ["sales", "salesRevenue", "surge", "newRelease"],
          type: "string",
          description: "Ranking preset, overriding explicit orders where documented.",
        },
        resourceId: {
          description: "A usable resource ID returned by resource generation. Reuse it throughout the same task.",
          minLength: 1,
          type: "string",
        },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["country", "categoryId", "resourceId", "cycleFilter"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          description: "Structured MCP content when available; otherwise the original MCP content envelope.",
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [
      {
        actionId: "xydc_mcp.read_category_insight_guide",
        description: "Read the official category insight workflow and resource reuse guidance.",
      },
    ],
  },
  {
    name: "get_category_review_analysis",
    description:
      "Get combined category star-rating and rating-count distributions and complete trends for a calendar month or the last 30 days. Costs 5 Credits per successful call. Read xydc_mcp.read_category_insight_guide before the first category insight task.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        categoryId: {
          description: "The category ID confirmed by the user.",
          minLength: 1,
          type: "string",
        },
        country: {
          description:
            "The Amazon marketplace explicitly selected by the user, such as US, UK or DE. Do not assume a marketplace.",
          minLength: 1,
          type: "string",
        },
        cycleFilter: strictObject(
          "One calendar month with both startDate/endDate and cycle defaulting to monthly, or period=last30days without dates. daily is only valid with last30days.",
          {
            cycle: {
              enum: ["monthly", "daily"],
              type: "string",
              description: "Calendar aggregation cycle.",
            },
            endDate: {
              description: "End date in YYYY-MM-DD format.",
              minLength: 1,
              type: "string",
            },
            period: {
              enum: ["last30days"],
              type: "string",
              description: "Rolling reporting period, used instead of explicit dates.",
            },
            startDate: {
              description: "Start date in YYYY-MM-DD format.",
              minLength: 1,
              type: "string",
            },
          },
          { required: [] },
        ),
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        priceType: {
          default: "allPrice",
          enum: ["allPrice", "lowPrice", "midPrice", "highPrice"],
          type: "string",
          description: "Price band to query.",
        },
        resourceId: {
          description: "A usable resource ID returned by resource generation. Reuse it throughout the same task.",
          minLength: 1,
          type: "string",
        },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["country", "categoryId", "resourceId", "cycleFilter"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          description: "Structured MCP content when available; otherwise the original MCP content envelope.",
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [
      {
        actionId: "xydc_mcp.read_category_insight_guide",
        description: "Read the official category insight workflow and resource reuse guidance.",
      },
    ],
  },
  {
    name: "get_category_sales_ranking",
    description:
      "Get category sales rankings aggregated by primaryAsin for required reportPeriod: YYYY-MM, YYYY, last30days or last12months, with brand/range filters, sorting and pagination. Costs 5 Credits per 5 returned representative ASINs, rounded up. Read xydc_mcp.read_category_insight_guide before the first category insight task.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        categoryId: {
          description: "The category ID confirmed by the user.",
          minLength: 1,
          type: "string",
        },
        country: {
          description:
            "The Amazon marketplace explicitly selected by the user, such as US, UK or DE. Do not assume a marketplace.",
          minLength: 1,
          type: "string",
        },
        filters: strictObject(
          "Categorical list filters.",
          {
            brands: {
              items: { description: "Brand name.", minLength: 1, type: "string" },
              type: "array",
              description: "Brand names to include.",
            },
          },
          { required: [] },
        ),
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        orders: {
          items: strictObject(
            "One orders item value.",
            {
              direction: { enum: ["asc", "desc"], type: "string", description: "Sort direction." },
              field: {
                enum: [
                  "sales",
                  "revenue",
                  "price",
                  "ratings",
                  "stars",
                  "salesMom",
                  "salesYoy",
                  "trafficScore",
                  "organicTrafficScoreRatio",
                  "height",
                  "length",
                  "width",
                  "weight",
                ],
                type: "string",
                description: "Field to sort by.",
              },
            },
            { required: ["field", "direction"] },
          ),
          type: "array",
          description: "List sorting rules.",
        },
        page: {
          default: 1,
          minimum: 1,
          type: "integer",
          description: "Page number starting at 1.",
        },
        pageSize: {
          default: 20,
          minimum: 1,
          type: "integer",
          description: "Number of records per page.",
        },
        query: {
          description: "Optional list search term. Omit to disable text filtering.",
          type: "string",
        },
        rangeFilters: strictObject(
          "Ranges on the same field are ORed; different fields are ANDed. Each range needs at least one bound and min must not exceed max. Put both bounds of a continuous range in the same item. Omitted bounds are unbounded. Inclusion rules are described on each field. Listing age uses streetDays; there is no legacy streetSince default filter.",
          {
            height: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One height item value.",
                {
                  max: { type: "integer", description: "Upper range bound." },
                  min: { type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
            length: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One length item value.",
                {
                  max: { type: "integer", description: "Upper range bound." },
                  min: { type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
            organicTrafficScoreRatio: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One organicTrafficScoreRatio item value.",
                {
                  max: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                  min: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                },
                { required: [] },
              ),
              type: "array",
            },
            price: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One price item value.",
                {
                  max: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                  min: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                },
                { required: [] },
              ),
              type: "array",
            },
            ratings: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One ratings item value.",
                {
                  max: { type: "integer", description: "Upper range bound." },
                  min: { type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
            revenue: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One revenue item value.",
                {
                  max: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                  min: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                },
                { required: [] },
              ),
              type: "array",
            },
            sales: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One sales item value.",
                {
                  max: { type: "integer", description: "Upper range bound." },
                  min: { type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
            salesMom: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One salesMom item value.",
                {
                  max: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                  min: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                },
                { required: [] },
              ),
              type: "array",
            },
            salesYoy: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One salesYoy item value.",
                {
                  max: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                  min: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                },
                { required: [] },
              ),
              type: "array",
            },
            stars: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One stars item value.",
                {
                  max: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                  min: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                },
                { required: [] },
              ),
              type: "array",
            },
            streetDays: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One streetDays item value.",
                {
                  max: { type: "integer", description: "Upper range bound." },
                  min: { type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
            trafficScore: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One trafficScore item value.",
                {
                  max: { type: "integer", description: "Upper range bound." },
                  min: { type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
            weight: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One weight item value.",
                {
                  max: { type: "integer", description: "Upper range bound." },
                  min: { type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
            width: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One width item value.",
                {
                  max: { type: "integer", description: "Upper range bound." },
                  min: { type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
          },
          { required: [] },
        ),
        reportPeriod: {
          description:
            "Required reporting period: YYYY-MM for a full calendar month, YYYY for a full calendar year, or last30days / last12months. Uses the marketplace time zone. Daily dates, date ranges and cycleFilter are unsupported. Calendar years always span January 1 through December 31, including the current year.",
          pattern:
            "^((000[1-9]|00[1-9][0-9]|0[1-9][0-9]{2}|[1-9][0-9]{3})(-(0[1-9]|1[0-2]))?|last30days|last12months)$",
          type: "string",
        },
        resourceId: {
          description: "A usable resource ID returned by resource generation. Reuse it throughout the same task.",
          minLength: 1,
          type: "string",
        },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["country", "categoryId", "resourceId", "reportPeriod"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          description: "Structured MCP content when available; otherwise the original MCP content envelope.",
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [
      {
        actionId: "xydc_mcp.read_category_insight_guide",
        description: "Read the official category insight workflow and resource reuse guidance.",
      },
    ],
  },
  {
    name: "get_category_seasonality",
    description:
      "Get category seasonality, peak/off seasons, sales comparisons and forecasts. Both nonseasonal and indeterminate results use isSeasonal=false with empty analysis; request failures are errors. Costs 5 Credits per successful call. Read xydc_mcp.read_category_insight_guide before the first category insight task.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        categoryId: {
          description: "The category ID confirmed by the user.",
          minLength: 1,
          type: "string",
        },
        country: {
          description:
            "The Amazon marketplace explicitly selected by the user, such as US, UK or DE. Do not assume a marketplace.",
          minLength: 1,
          type: "string",
        },
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        resourceId: {
          description: "A usable resource ID returned by resource generation. Reuse it throughout the same task.",
          minLength: 1,
          type: "string",
        },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["country", "categoryId", "resourceId"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          description: "Structured MCP content when available; otherwise the original MCP content envelope.",
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [
      {
        actionId: "xydc_mcp.read_category_insight_guide",
        description: "Read the official category insight workflow and resource reuse guidance.",
      },
    ],
  },
  {
    name: "get_category_surging_ranking",
    description:
      "Get category surging-product rankings for required reportPeriod: YYYY-MM, YYYY, last30days or last12months, with growth rules, filtering and sorting. Costs 5 Credits per 5 representative ASINs. Read xydc_mcp.read_category_insight_guide before the first category insight task.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        categoryId: {
          description: "The category ID confirmed by the user.",
          minLength: 1,
          type: "string",
        },
        country: {
          description:
            "The Amazon marketplace explicitly selected by the user, such as US, UK or DE. Do not assume a marketplace.",
          minLength: 1,
          type: "string",
        },
        filters: strictObject(
          "Categorical list filters.",
          {
            brands: {
              items: { description: "Brand name.", minLength: 1, type: "string" },
              type: "array",
              description: "Brand names to include.",
            },
          },
          { required: [] },
        ),
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        orders: {
          items: strictObject(
            "One orders item value.",
            {
              direction: { enum: ["asc", "desc"], type: "string", description: "Sort direction." },
              field: {
                enum: [
                  "sales",
                  "revenue",
                  "price",
                  "ratings",
                  "stars",
                  "salesMom",
                  "salesYoy",
                  "trafficScore",
                  "organicTrafficScoreRatio",
                  "height",
                  "length",
                  "width",
                  "weight",
                ],
                type: "string",
                description: "Field to sort by.",
              },
            },
            { required: ["field", "direction"] },
          ),
          type: "array",
          description: "List sorting rules.",
        },
        page: {
          default: 1,
          minimum: 1,
          type: "integer",
          description: "Page number starting at 1.",
        },
        pageSize: {
          default: 20,
          minimum: 1,
          type: "integer",
          description: "Number of records per page.",
        },
        query: {
          description: "Optional list search term. Omit to disable text filtering.",
          type: "string",
        },
        rangeFilters: strictObject(
          "Ranges on the same field are ORed; different fields are ANDed. Each range needs at least one bound and min must not exceed max. Put both bounds of a continuous range in the same item. Omitted bounds are unbounded. Inclusion rules are described on each field. Listing age uses streetDays; there is no legacy streetSince default filter.",
          {
            height: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One height item value.",
                {
                  max: { type: "integer", description: "Upper range bound." },
                  min: { type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
            length: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One length item value.",
                {
                  max: { type: "integer", description: "Upper range bound." },
                  min: { type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
            organicTrafficScoreRatio: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One organicTrafficScoreRatio item value.",
                {
                  max: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                  min: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                },
                { required: [] },
              ),
              type: "array",
            },
            price: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One price item value.",
                {
                  max: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                  min: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                },
                { required: [] },
              ),
              type: "array",
            },
            ratings: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One ratings item value.",
                {
                  max: { type: "integer", description: "Upper range bound." },
                  min: { type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
            revenue: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One revenue item value.",
                {
                  max: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                  min: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                },
                { required: [] },
              ),
              type: "array",
            },
            sales: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One sales item value.",
                {
                  max: { type: "integer", description: "Upper range bound." },
                  min: { type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
            salesMom: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One salesMom item value.",
                {
                  max: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                  min: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                },
                { required: [] },
              ),
              type: "array",
            },
            salesYoy: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One salesYoy item value.",
                {
                  max: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                  min: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                },
                { required: [] },
              ),
              type: "array",
            },
            stars: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One stars item value.",
                {
                  max: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                  min: {
                    description: "A finite decimal string, such as 12.50. Either min or max may be provided alone.",
                    type: "string",
                  },
                },
                { required: [] },
              ),
              type: "array",
            },
            streetDays: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One streetDays item value.",
                {
                  max: { type: "integer", description: "Upper range bound." },
                  min: { type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
            trafficScore: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One trafficScore item value.",
                {
                  max: { type: "integer", description: "Upper range bound." },
                  min: { type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
            weight: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One weight item value.",
                {
                  max: { type: "integer", description: "Upper range bound." },
                  min: { type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
            width: {
              description: "Half-open interval [min,max): includes min, excludes max.",
              items: strictObject(
                "One width item value.",
                {
                  max: { type: "integer", description: "Upper range bound." },
                  min: { type: "integer", description: "Lower range bound." },
                },
                { required: [] },
              ),
              type: "array",
            },
          },
          { required: [] },
        ),
        reportPeriod: {
          description:
            "Required reporting period: YYYY-MM for a full calendar month, YYYY for a full calendar year, or last30days / last12months. Uses the marketplace time zone. Daily dates, date ranges and cycleFilter are unsupported. Calendar years always span January 1 through December 31, including the current year.",
          pattern:
            "^((000[1-9]|00[1-9][0-9]|0[1-9][0-9]{2}|[1-9][0-9]{3})(-(0[1-9]|1[0-2]))?|last30days|last12months)$",
          type: "string",
        },
        resourceId: {
          description: "A usable resource ID returned by resource generation. Reuse it throughout the same task.",
          minLength: 1,
          type: "string",
        },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["country", "categoryId", "resourceId", "reportPeriod"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          description: "Structured MCP content when available; otherwise the original MCP content envelope.",
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [
      {
        actionId: "xydc_mcp.read_category_insight_guide",
        description: "Read the official category insight workflow and resource reuse guidance.",
      },
    ],
  },
  {
    name: "get_keyword_aba_trends",
    description:
      "Get weekly ABA search-volume trends for up to 100 keywords and at most 52 calendar weeks. ABA weeks run Sunday through Saturday, unlike ASIN traffic weeks.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        country: { description: "Marketplace country code.", type: "string" },
        end_week: {
          description:
            "Any date in the final week, in YYYY-MM-DD format; expanded to Saturday. Weeks run Sunday through Saturday.",
          type: "string",
        },
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        keywords: {
          description: "Up to 100 keywords sharing the same country. Split larger requests into batches.",
          items: { type: "string", description: "One keywords item value." },
          type: "array",
          maxItems: 100,
        },
        start_week: {
          description:
            "Any date in the first week, in YYYY-MM-DD format; expanded to Sunday. Weeks run Sunday through Saturday.",
          type: "string",
        },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["keywords", "start_week", "end_week", "country"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_keyword_advertising_replay",
    description:
      "Replay hourly advertising placements for one keyword on one day in US, UK or DE, returning up to 24 hours of placement competition.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        country: {
          description: "Marketplace country code: US, UK or DE only.",
          type: "string",
          enum: ["US", "UK", "DE"],
        },
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        keyword: { description: "Keyword.", type: "string" },
        report_date: { description: "Report date in YYYY-MM-DD format.", type: "string" },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["keyword", "country", "report_date"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_keyword_analysis_monthly",
    description: "Get monthly ASIN competition, rankings and traffic for one keyword over a month range.",
    operationType: "read",
    inputSchema: Object.assign(
      strictObject(
        "Tool input.",
        {
          country: { description: "Marketplace country code.", type: "string" },
          end_month: { description: "End month in YYYY-MM format.", type: "string" },
          intent_summary: {
            description:
              "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
            type: "string",
          },
          keyword: { description: "Keyword.", type: "string" },
          page: {
            default: 1,
            description: "Page number starting at 1. Default: 1.",
            type: "integer",
            minimum: 1,
          },
          page_size: {
            default: 20,
            description: "Page size from 1 to 10000. Default: 20. A size of 10000 only supports page 1.",
            type: "integer",
            minimum: 1,
            maximum: 10000,
          },
          sort_field: {
            description:
              "Sort field. Default: traffic. Supports traffic, trafficAcquisitionRate, advertisingTraffic, advertisingTrafficAcquisitionRate, organicTraffic, organicTrafficAcquisitionRate, spRank, orRank and trafficRatio.",
            type: "string",
          },
          sort_order: {
            description: "Sort direction: asc or desc. Default: desc.",
            type: "string",
            enum: ["asc", "desc"],
          },
          start_month: { description: "Start month in YYYY-MM format.", type: "string" },
          user_task: {
            description:
              "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
            type: "string",
          },
        },
        { required: ["keyword", "start_month", "end_month", "country"] },
      ),
      {
        allOf: [
          {
            if: { properties: { page_size: { const: 10000 } }, required: ["page_size"] },
            then: { properties: { page: { const: 1 } } },
          },
        ],
      },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_keyword_asin_analysis",
    description:
      "Reverse-search competing ASINs and their rankings and traffic for one keyword in the latest seven-day snapshot.",
    operationType: "read",
    inputSchema: Object.assign(
      strictObject(
        "Tool input.",
        {
          country: { description: "Marketplace country code.", type: "string" },
          intent_summary: {
            description:
              "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
            type: "string",
          },
          keyword: { description: "Keyword.", type: "string" },
          page: {
            default: 1,
            description: "Page number starting at 1. Default: 1.",
            type: "integer",
            minimum: 1,
          },
          page_size: {
            default: 20,
            description: "Page size from 1 to 10000. Default: 20. A size of 10000 only supports page 1.",
            type: "integer",
            minimum: 1,
            maximum: 10000,
          },
          sort_field: {
            description:
              "Sort field. Default: traffic. Supports traffic, trafficAcquisitionRate, advertisingTraffic, advertisingTrafficAcquisitionRate, organicTraffic, organicTrafficAcquisitionRate, spRank, orRank and trafficRatio.",
            type: "string",
          },
          sort_order: {
            description: "Sort direction: asc or desc. Default: desc.",
            type: "string",
            enum: ["asc", "desc"],
          },
          user_task: {
            description:
              "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
            type: "string",
          },
        },
        { required: ["keyword", "country"] },
      ),
      {
        allOf: [
          {
            if: { properties: { page_size: { const: 10000 } }, required: ["page_size"] },
            then: { properties: { page: { const: 1 } } },
          },
        ],
      },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_keyword_info",
    description:
      "Get the latest weekly search volume, ABA ranking, competition difficulty and suggested bids for up to 100 keywords in one marketplace.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        country: { description: "Marketplace country code.", type: "string" },
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        keywords: {
          description: "Up to 100 keywords sharing the same country. Split larger requests into batches.",
          items: { type: "string", description: "One keywords item value." },
          type: "array",
          maxItems: 100,
        },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["keywords", "country"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_multi_asin_keyword_comparison",
    description:
      "Compare latest seven-day keyword coverage, rankings and traffic across up to 20 ASINs when the user requests comparison or keyword-library building. Do not silently combine independent ASIN queries.",
    operationType: "read",
    inputSchema: Object.assign(
      strictObject(
        "Tool input.",
        {
          asins: {
            description: "Up to 20 ASINs in one comparison, all sharing the same country.",
            items: { type: "string", description: "One asins item value." },
            type: "array",
            maxItems: 20,
          },
          country: { description: "Marketplace country code.", type: "string" },
          intent_summary: {
            description:
              "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
            type: "string",
          },
          page: {
            default: 1,
            description: "Page number starting at 1. Default: 1.",
            type: "integer",
            minimum: 1,
          },
          page_size: {
            default: 20,
            description: "Page size from 1 to 10000. Default: 20. A size of 10000 only supports page 1.",
            type: "integer",
            minimum: 1,
            maximum: 10000,
          },
          sort_field: {
            description:
              "Sort field. Default: traffic. Supports traffic, trafficAcquisitionRate, advertisingTraffic, advertisingTrafficAcquisitionRate, organicTraffic, organicTrafficAcquisitionRate, spRank and orRank.",
            type: "string",
          },
          sort_order: {
            description: "Sort direction: asc or desc. Default: desc.",
            type: "string",
            enum: ["asc", "desc"],
          },
          user_task: {
            description:
              "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
            type: "string",
          },
        },
        { required: ["asins", "country"] },
      ),
      {
        allOf: [
          {
            if: { properties: { page_size: { const: 10000 } }, required: ["page_size"] },
            then: { properties: { page: { const: 1 } } },
          },
        ],
      },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_multi_asin_keyword_comparison_monthly",
    description:
      "Compare historical monthly keyword coverage, rankings and traffic across up to 20 ASINs for comparison or keyword-library building.",
    operationType: "read",
    inputSchema: Object.assign(
      strictObject(
        "Tool input.",
        {
          asins: {
            description: "Up to 20 ASINs in one comparison, all sharing the same country.",
            items: { type: "string", description: "One asins item value." },
            type: "array",
            maxItems: 20,
          },
          country: { description: "Marketplace country code.", type: "string" },
          end_month: { description: "End month in YYYY-MM format.", type: "string" },
          intent_summary: {
            description:
              "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
            type: "string",
          },
          page: {
            default: 1,
            description: "Page number starting at 1. Default: 1.",
            type: "integer",
            minimum: 1,
          },
          page_size: {
            default: 20,
            description: "Page size from 1 to 10000. Default: 20. A size of 10000 only supports page 1.",
            type: "integer",
            minimum: 1,
            maximum: 10000,
          },
          sort_field: {
            description:
              "Sort field. Default: traffic. Supports traffic, trafficAcquisitionRate, advertisingTraffic, advertisingTrafficAcquisitionRate, organicTraffic, organicTrafficAcquisitionRate, spRank and orRank.",
            type: "string",
          },
          sort_order: {
            description: "Sort direction: asc or desc. Default: desc.",
            type: "string",
            enum: ["asc", "desc"],
          },
          start_month: { description: "Start month in YYYY-MM format.", type: "string" },
          user_task: {
            description:
              "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
            type: "string",
          },
        },
        { required: ["asins", "start_month", "end_month", "country"] },
      ),
      {
        allOf: [
          {
            if: { properties: { page_size: { const: 10000 } }, required: ["page_size"] },
            then: { properties: { page: { const: 1 } } },
          },
        ],
      },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_parent_asin_keywords",
    description:
      "Get latest seven-day keywords across all children of one parent. Supply one child ASIN; XYDC resolves its parent. Use only for an explicitly requested parent-level analysis.",
    operationType: "read",
    inputSchema: Object.assign(
      strictObject(
        "Tool input.",
        {
          asin: { description: "ASIN.", type: "string" },
          country: { description: "Marketplace country code.", type: "string" },
          intent_summary: {
            description:
              "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
            type: "string",
          },
          page: {
            default: 1,
            description: "Page number starting at 1. Default: 1.",
            type: "integer",
            minimum: 1,
          },
          page_size: {
            default: 20,
            description: "Page size from 1 to 10000. Default: 20. A size of 10000 only supports page 1.",
            type: "integer",
            minimum: 1,
            maximum: 10000,
          },
          sort_field: {
            description:
              "Sort field. Default: traffic. Supports traffic, trafficAcquisitionRate, advertisingTraffic, advertisingTrafficAcquisitionRate, organicTraffic, organicTrafficAcquisitionRate, spRank and orRank.",
            type: "string",
          },
          sort_order: {
            description: "Sort direction: asc or desc. Default: desc.",
            type: "string",
            enum: ["asc", "desc"],
          },
          user_task: {
            description:
              "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
            type: "string",
          },
        },
        { required: ["asin", "country"] },
      ),
      {
        allOf: [
          {
            if: { properties: { page_size: { const: 10000 } }, required: ["page_size"] },
            then: { properties: { page: { const: 1 } } },
          },
        ],
      },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_parent_asin_keywords_monthly",
    description:
      "Get historical monthly keywords across all children of one parent. Supply one child ASIN; XYDC resolves its parent. Use only for an explicitly requested parent-level analysis.",
    operationType: "read",
    inputSchema: Object.assign(
      strictObject(
        "Tool input.",
        {
          asin: { description: "ASIN.", type: "string" },
          country: { description: "Marketplace country code.", type: "string" },
          end_month: { description: "End month in YYYY-MM format.", type: "string" },
          intent_summary: {
            description:
              "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
            type: "string",
          },
          page: {
            default: 1,
            description: "Page number starting at 1. Default: 1.",
            type: "integer",
            minimum: 1,
          },
          page_size: {
            default: 20,
            description: "Page size from 1 to 10000. Default: 20. A size of 10000 only supports page 1.",
            type: "integer",
            minimum: 1,
            maximum: 10000,
          },
          sort_field: {
            description:
              "Sort field. Default: traffic. Supports traffic, trafficAcquisitionRate, advertisingTraffic, advertisingTrafficAcquisitionRate, organicTraffic, organicTrafficAcquisitionRate, spRank and orRank.",
            type: "string",
          },
          sort_order: {
            description: "Sort direction: asc or desc. Default: desc.",
            type: "string",
            enum: ["asc", "desc"],
          },
          start_month: { description: "Start month in YYYY-MM format.", type: "string" },
          user_task: {
            description:
              "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
            type: "string",
          },
        },
        { required: ["asin", "start_month", "end_month", "country"] },
      ),
      {
        allOf: [
          {
            if: { properties: { page_size: { const: 10000 } }, required: ["page_size"] },
            then: { properties: { page: { const: 1 } } },
          },
        ],
      },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "XYDC business status, billed Credits and data.",
          properties: {
            status: { type: "integer", description: "Upstream business status code." },
            cost_credits: {
              type: "integer",
              description: "Credits consumed by this call.",
              minimum: 0,
            },
            data: {
              type: "object",
              description: "Tool data or structured upstream error details.",
              additionalProperties: true,
            },
          },
          required: ["status", "cost_credits", "data"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "get_primary_asin_children",
    description:
      "Get children and complete trends for one representative primaryAsin string, with reporting periods, price bands and pagination. Costs 5 Credits per 20 child ASINs. Read xydc_mcp.read_category_insight_guide before the first category insight task.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        categoryId: {
          description: "The category ID confirmed by the user.",
          minLength: 1,
          type: "string",
        },
        country: {
          description:
            "The Amazon marketplace explicitly selected by the user, such as US, UK or DE. Do not assume a marketplace.",
          minLength: 1,
          type: "string",
        },
        cycleFilter: strictObject(
          "Monthly/yearly rankings require cycle=monthly/yearly and startDate/endDate within the same calendar month/year. Alternatively use only period=last30days/last12months. Dates use the marketplace time zone.",
          {
            cycle: {
              enum: ["monthly", "yearly", "daily"],
              type: "string",
              description: "Calendar aggregation cycle.",
            },
            endDate: {
              description: "End date in YYYY-MM-DD format.",
              minLength: 1,
              type: "string",
            },
            period: {
              enum: ["last30days", "last12months"],
              type: "string",
              description: "Rolling reporting period, used instead of explicit dates.",
            },
            startDate: {
              description: "Start date in YYYY-MM-DD format.",
              minLength: 1,
              type: "string",
            },
          },
          { required: [] },
        ),
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        page: {
          default: 1,
          minimum: 1,
          type: "integer",
          description: "Page number starting at 1.",
        },
        pageSize: {
          default: 20,
          minimum: 1,
          type: "integer",
          description: "Number of records per page.",
        },
        priceType: {
          default: "allPrice",
          enum: ["allPrice", "lowPrice", "midPrice", "highPrice"],
          type: "string",
          description: "Price band to query.",
        },
        primaryAsin: {
          description: "One representative ASIN string. Arrays and multiple subjects are unsupported.",
          minLength: 1,
          type: "string",
        },
        resourceId: {
          description: "A usable resource ID returned by resource generation. Reuse it throughout the same task.",
          minLength: 1,
          type: "string",
        },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["country", "categoryId", "resourceId", "cycleFilter", "primaryAsin"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          description: "Structured MCP content when available; otherwise the original MCP content envelope.",
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [
      {
        actionId: "xydc_mcp.read_category_insight_guide",
        description: "Read the official category insight workflow and resource reuse guidance.",
      },
    ],
  },
  {
    name: "report_missing_xiyou_capability",
    description:
      "Submit a missing-capability feedback event to XYDC when requested by the user. This records product feedback, not Amazon data, and should not be used for ordinary input errors. Redact sensitive information before submission.",
    operationType: "write",
    inputSchema: strictObject(
      "Tool input.",
      {
        current_blocker: {
          description:
            "Why current tools cannot meet the need or require an impractical tool chain. Do not include the original user prompt.",
          type: "string",
        },
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        missing_capability: {
          description: "The missing XYDC capability: describe the missing analysis, data or automation steps.",
          type: "string",
        },
        suggested_tool_name: { description: "Suggested name for a future tool.", type: "string" },
        tried_tools: {
          description: "Names of MCP tools already tried without meeting the need.",
          items: { type: "string", description: "One tried_tools item value." },
          type: "array",
        },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["intent_summary", "missing_capability", "current_blocker"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "Capability feedback confirmation returned by XYDC.",
          properties: {
            ok: { type: "boolean", description: "Whether the feedback was recorded." },
            event_id: { type: "string", description: "Feedback event identifier." },
            message: { type: "string", description: "Feedback confirmation message." },
          },
          required: ["ok", "event_id", "message"],
          additionalProperties: true,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [],
  },
  {
    name: "search_market_insight_categories",
    description:
      "Search Amazon categories by keyword or ASIN, returning paths, representative-ASIN counts, availability and existing translations. Free. Present candidates and obtain user confirmation before generating a category resource, even for one candidate. Read xydc_mcp.read_category_insight_guide before the first category insight task.",
    operationType: "read",
    inputSchema: strictObject(
      "Tool input.",
      {
        country: {
          description:
            "The Amazon marketplace explicitly selected by the user, such as US, UK or DE. Do not assume a marketplace.",
          minLength: 1,
          type: "string",
        },
        intent_summary: {
          description:
            "Optional purpose of this tool call and how it helps the current task. Describe only this step, without repeating the complete task, analysis plan or conclusions. Redact sensitive information before sending.",
          type: "string",
        },
        query: {
          description: "A keyword or one ASIN; XYDC detects the query type automatically.",
          minLength: 1,
          type: "string",
        },
        user_task: {
          description:
            "Optional original user request for the current task, preserving the wording, subjects, dates and constraints after redacting sensitive information. Keep it consistent within the same task; do not replace it with a subtask, inferred plan or summary. Preserve public ASINs, keywords, marketplaces and dates; redact account details, contacts, credentials and sensitive URL parameters before sending to XYDC.",
          type: "string",
        },
      },
      { required: ["country", "query"] },
    ),
    outputSchema: {
      description: "Normalized MCP tool output.",
      type: "object",
      properties: {
        result: {
          description: "Structured MCP content when available; otherwise the original MCP content envelope.",
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
    followUpActions: [
      {
        actionId: "xydc_mcp.read_category_insight_guide",
        description: "Read the official category insight workflow and resource reuse guidance.",
      },
    ],
  },
];
