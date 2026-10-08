import type { TikHubEndpointMethod } from "./endpoint-policy.ts";
import type { TikHubDiscoveredEndpoint } from "./endpoint-types.ts";

import { createHash } from "node:crypto";
import { ProviderRequestError } from "../provider-runtime.ts";
import { matchTikHubEndpointPolicy } from "./endpoint-policy.ts";

const tikhubOpenApiMaxSchemaDepth = 64;
const tikhubOpenApiMaxSchemaNodes = 5_000;
const tikhubOpenApiMaxRefResolutions = 256;
const tikhubNormalizedRequestSchemaMaxBytes = 256 * 1024;

interface OpenApiNormalizationBudget {
  schemaNodes: number;
  refResolutions: number;
}

export function parseTikHubOpenApiCatalog(content: string): TikHubDiscoveredEndpoint[] {
  let root: unknown;
  try {
    root = JSON.parse(content) as unknown;
  } catch {
    throw providerDocumentError("catalog", "contains invalid OpenAPI JSON");
  }
  const rootRecord = requireRecord(root, "catalog", "OpenAPI document");
  const paths = requireRecord(rootRecord.paths, "catalog", "paths");
  const endpoints: TikHubDiscoveredEndpoint[] = [];
  for (const [path, rawPathItem] of Object.entries(paths)) {
    let pathItem: Record<string, unknown>;
    try {
      pathItem = requireRecord(rawPathItem, path, `path item ${path}`);
    } catch (error) {
      if (!(error instanceof ProviderRequestError)) {
        throw error;
      }
      continue;
    }
    for (const methodName of ["get", "post"] as const) {
      if (pathItem[methodName] === undefined) {
        continue;
      }
      let endpoint: TikHubDiscoveredEndpoint | undefined;
      try {
        const operation = requireRecord(pathItem[methodName], path, `${methodName} operation`);
        endpoint = parseTikHubOpenApiOperation({
          root: rootRecord,
          pathItem,
          operation,
          method: methodName.toUpperCase() as TikHubEndpointMethod,
          path,
        });
      } catch (error) {
        if (!(error instanceof ProviderRequestError)) {
          throw error;
        }
        endpoint = undefined;
      }
      if (endpoint) {
        endpoints.push(endpoint);
      }
    }
  }
  return endpoints;
}

interface TikHubOpenApiOperationInput {
  root: Record<string, unknown>;
  pathItem: Record<string, unknown>;
  operation: Record<string, unknown>;
  method: TikHubEndpointMethod;
  path: string;
}

function parseTikHubOpenApiOperation(input: TikHubOpenApiOperationInput): TikHubDiscoveredEndpoint | undefined {
  const category = readOperationCategory(input.operation);
  const title = readNonEmptyString(input.operation.summary);
  const operationId = readNonEmptyString(input.operation.operationId);
  const endpointName = `${input.method} ${input.path}`;
  if (!category || !title || !operationId) {
    throw providerDocumentError(endpointName, "does not declare category, summary, and operationId");
  }
  const policy = matchTikHubEndpointPolicy(input.method, input.path, category);
  if (!policy) {
    return undefined;
  }

  const budget: OpenApiNormalizationBudget = { schemaNodes: 0, refResolutions: 0 };
  const parameters = readOperationParameters({
    root: input.root,
    pathItem: input.pathItem,
    operation: input.operation,
    endpointId: endpointName,
    budget,
  });
  validatePathParameters(policy.placeholders, parameters, endpointName);
  const body = readRequestBody({
    root: input.root,
    operation: input.operation,
    method: input.method,
    endpointId: endpointName,
    budget,
  });
  const requestSchema = buildRequestSchema(parameters, body);
  if (new TextEncoder().encode(JSON.stringify(requestSchema)).byteLength > tikhubNormalizedRequestSchemaMaxBytes) {
    throw providerDocumentError(endpointName, "produces an oversized request schema");
  }

  const contractHash = sha256Hex(
    stableJsonStringify({
      method: input.method,
      path: input.path,
      parameters: parameters
        .map((parameter) => ({
          in: parameter.location,
          name: parameter.name,
          required: parameter.required,
          schema: stripSchemaAnnotations(parameter.schema),
        }))
        .sort((left, right) => `${left.in}:${left.name}`.localeCompare(`${right.in}:${right.name}`)),
      requestBody: body
        ? {
            required: body.required,
            schema: stripSchemaAnnotations(body.schema),
          }
        : null,
    }),
  );

  return {
    category,
    title,
    description: readNonEmptyString(input.operation.description)?.slice(0, 4_000) ?? "",
    operationId,
    method: input.method,
    path: input.path,
    requiredScope: policy.requiredScope,
    contractHash,
    requestSchema,
  };
}

function readOperationCategory(operation: Record<string, unknown>) {
  const folder = readNonEmptyString(operation["x-apifox-folder"]);
  if (folder) {
    return folder;
  }
  const tags = operation.tags;
  return Array.isArray(tags) ? readNonEmptyString(tags[0]) : undefined;
}

interface NormalizedParameter {
  name: string;
  location: "path" | "query";
  required: boolean;
  schema: Record<string, unknown>;
}

function readOperationParameters(input: {
  root: Record<string, unknown>;
  pathItem: Record<string, unknown>;
  operation: Record<string, unknown>;
  endpointId: string;
  budget: OpenApiNormalizationBudget;
}) {
  const rawParameters = [
    ...readArray(input.pathItem.parameters, input.endpointId, "path parameters"),
    ...readArray(input.operation.parameters, input.endpointId, "operation parameters"),
  ];
  const parameters = new Map<string, NormalizedParameter>();

  for (const rawParameter of rawParameters) {
    const resolved = resolveLocalObject(rawParameter, input.root, input.endpointId, new Set(), input.budget);
    const name = readNonEmptyString(resolved.name);
    const location = resolved.in;
    if (!name || (location !== "path" && location !== "query")) {
      throw providerDocumentError(input.endpointId, "uses an unsupported parameter location");
    }
    validateParameterSerialization(resolved, location, input.endpointId);
    const schema = sanitizeSchema(resolved.schema, input.root, input.endpointId, new Set(), input.budget);
    if (location === "query" && !isSerializableQuerySchema(schema, true)) {
      throw providerDocumentError(input.endpointId, `query parameter ${name} cannot be represented by invoke_endpoint`);
    }
    if (schema.description === undefined) {
      const description = readNonEmptyString(resolved.description);
      if (description) {
        schema.description = description;
      }
    }
    parameters.set(`${location}:${name}`, {
      name,
      location,
      required: location === "path" || resolved.required === true,
      schema,
    });
  }
  return [...parameters.values()];
}

function isSerializableQuerySchema(schema: Record<string, unknown>, allowArray: boolean): boolean {
  let hasCombination = false;
  for (const keyword of ["anyOf", "oneOf", "allOf"] as const) {
    const variants = schema[keyword];
    if (variants !== undefined) {
      hasCombination = true;
    }
    if (
      variants !== undefined &&
      (!Array.isArray(variants) ||
        variants.length === 0 ||
        !variants.every((variant) => isRecord(variant) && isSerializableQuerySchema(variant, allowArray)))
    ) {
      return false;
    }
  }
  if (
    schema.type === "string" ||
    schema.type === "number" ||
    schema.type === "integer" ||
    schema.type === "boolean" ||
    schema.type === "null"
  ) {
    return true;
  }
  if (allowArray && schema.type === "array") {
    return isRecord(schema.items) && isSerializableQuerySchema(schema.items, false);
  }
  if (schema.type === undefined && Array.isArray(schema.enum)) {
    return schema.enum.every(isJsonScalar);
  }
  return schema.type === undefined && hasCombination;
}

function isJsonScalar(value: unknown) {
  return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function validateParameterSerialization(
  parameter: Record<string, unknown>,
  location: "path" | "query",
  endpointId: string,
) {
  if (parameter.content !== undefined) {
    throw providerDocumentError(endpointId, "uses content-based parameter serialization");
  }
  const style = parameter.style;
  const explode = parameter.explode;
  if (location === "path" && style !== undefined && style !== "simple") {
    throw providerDocumentError(endpointId, "uses unsupported path parameter serialization");
  }
  if (location === "path" && explode === true) {
    throw providerDocumentError(endpointId, "uses unsupported exploded path parameters");
  }
  if (location === "query" && style !== undefined && style !== "form") {
    throw providerDocumentError(endpointId, "uses unsupported query parameter serialization");
  }
  if (location === "query" && explode === false) {
    throw providerDocumentError(endpointId, "uses unsupported compact query arrays");
  }
  if (location === "query" && parameter.allowReserved === true) {
    throw providerDocumentError(endpointId, "uses unsupported reserved query serialization");
  }
}

function validatePathParameters(placeholders: string[], parameters: NormalizedParameter[], endpointId: string) {
  const pathNames = parameters
    .filter((parameter) => parameter.location === "path")
    .map((parameter) => parameter.name)
    .sort();
  const expected = [...placeholders].sort();
  if (stableJsonStringify(pathNames) !== stableJsonStringify(expected)) {
    throw providerDocumentError(endpointId, "path parameters do not match path placeholders");
  }
}

interface NormalizedRequestBody {
  required: boolean;
  schema: Record<string, unknown>;
}

function readRequestBody(input: {
  root: Record<string, unknown>;
  operation: Record<string, unknown>;
  method: TikHubEndpointMethod;
  endpointId: string;
  budget: OpenApiNormalizationBudget;
}): NormalizedRequestBody | undefined {
  if (input.operation.requestBody === undefined) {
    return undefined;
  }
  if (input.method === "GET") {
    throw providerDocumentError(input.endpointId, "declares a request body for GET");
  }

  const requestBody = resolveLocalObject(
    input.operation.requestBody,
    input.root,
    input.endpointId,
    new Set(),
    input.budget,
  );
  const content = requireRecord(requestBody.content, input.endpointId, "request body content");
  const mediaTypes = Object.keys(content);
  if (mediaTypes.length !== 1 || mediaTypes[0] !== "application/json") {
    throw providerDocumentError(input.endpointId, "uses an unsupported request body media type");
  }
  const media = requireRecord(content["application/json"], input.endpointId, "JSON request body");
  return {
    required: requestBody.required === true,
    schema: sanitizeSchema(media.schema, input.root, input.endpointId, new Set(), input.budget),
  };
}

function buildRequestSchema(parameters: NormalizedParameter[], body: NormalizedRequestBody | undefined) {
  const pathParameters = parameters.filter((parameter) => parameter.location === "path");
  const queryParameters = parameters.filter((parameter) => parameter.location === "query");
  const required = [
    ...(pathParameters.length > 0 ? ["path"] : []),
    ...(queryParameters.some((parameter) => parameter.required) ? ["query"] : []),
    ...(body?.required ? ["body"] : []),
  ];
  const schema: Record<string, unknown> = {
    type: "object",
    properties: {
      path: parameterObjectSchema("Path parameters for the endpoint.", pathParameters),
      query: parameterObjectSchema("Query parameters for the endpoint.", queryParameters),
      body: body?.schema ?? {
        type: "null",
        description: "This endpoint does not accept a JSON request body.",
      },
    },
    ...(required.length > 0 ? { required } : {}),
    additionalProperties: false,
    description: "The dynamic request envelope accepted by tikhub.invoke_endpoint.",
  };
  return schema;
}

function parameterObjectSchema(description: string, parameters: NormalizedParameter[]) {
  const properties = Object.fromEntries(parameters.map((parameter) => [parameter.name, parameter.schema]));
  const required = parameters.filter((parameter) => parameter.required).map((parameter) => parameter.name);
  return {
    type: "object",
    properties,
    ...(required.length > 0 ? { required } : {}),
    additionalProperties: false,
    description,
  };
}

function sanitizeSchema(
  rawSchema: unknown,
  root: Record<string, unknown>,
  endpointId: string,
  refStack: Set<string>,
  budget: OpenApiNormalizationBudget,
  depth = 0,
): Record<string, unknown> {
  consumeSchemaBudget(budget, depth, endpointId);
  const resolved = resolveLocalObject(rawSchema, root, endpointId, refStack, budget, true);
  const result: Record<string, unknown> = {};
  const ignoredAnnotations = new Set([
    "title",
    "summary",
    "example",
    "examples",
    "deprecated",
    "readOnly",
    "writeOnly",
    "xml",
    "externalDocs",
  ]);
  const scalarKeywords = new Set([
    "type",
    "description",
    "default",
    "minimum",
    "maximum",
    "exclusiveMinimum",
    "exclusiveMaximum",
    "multipleOf",
    "minLength",
    "maxLength",
    "pattern",
    "minItems",
    "maxItems",
    "uniqueItems",
    "minProperties",
    "maxProperties",
  ]);

  for (const [key, value] of Object.entries(resolved)) {
    if (ignoredAnnotations.has(key) || key.startsWith("x-")) {
      continue;
    }
    if (scalarKeywords.has(key)) {
      result[key] = requireJsonValue(value, endpointId, `schema keyword ${key}`, budget, depth + 1);
      continue;
    }
    if (key === "format") {
      const format = readNonEmptyString(value);
      if (!format || ["binary", "byte", "base64", "data-url"].includes(format.toLowerCase())) {
        throw providerDocumentError(endpointId, "uses an unsupported binary schema format");
      }
      result.format = format;
      continue;
    }
    if (key === "enum") {
      result.enum = readArray(value, endpointId, "schema enum").map((item) =>
        requireJsonValue(item, endpointId, "schema enum value", budget, depth + 1),
      );
      continue;
    }
    if (key === "required") {
      result.required = readArray(value, endpointId, "schema required").map((item) => {
        const name = readNonEmptyString(item);
        if (!name) {
          throw providerDocumentError(endpointId, "contains an invalid required property name");
        }
        return name;
      });
      continue;
    }
    if (key === "properties") {
      const properties = requireRecord(value, endpointId, "schema properties");
      result.properties = Object.fromEntries(
        Object.entries(properties).map(([name, schema]) => [
          name,
          sanitizeSchema(schema, root, endpointId, new Set(refStack), budget, depth + 1),
        ]),
      );
      continue;
    }
    if (key === "items" || key === "not") {
      result[key] = sanitizeSchema(value, root, endpointId, new Set(refStack), budget, depth + 1);
      continue;
    }
    if (key === "additionalProperties") {
      result.additionalProperties =
        typeof value === "boolean"
          ? value
          : sanitizeSchema(value, root, endpointId, new Set(refStack), budget, depth + 1);
      continue;
    }
    if (key === "anyOf" || key === "oneOf" || key === "allOf") {
      result[key] = readArray(value, endpointId, `schema ${key}`).map((schema) =>
        sanitizeSchema(schema, root, endpointId, new Set(refStack), budget, depth + 1),
      );
      continue;
    }
    throw providerDocumentError(endpointId, `uses unsupported schema keyword ${key}`);
  }

  const type = result.type;
  if (
    type !== undefined &&
    type !== "object" &&
    type !== "array" &&
    type !== "string" &&
    type !== "number" &&
    type !== "integer" &&
    type !== "boolean" &&
    type !== "null"
  ) {
    throw providerDocumentError(endpointId, "uses an unsupported schema type");
  }
  validateNormalizedSchemaKeywords(result, endpointId);
  return result;
}

function validateNormalizedSchemaKeywords(schema: Record<string, unknown>, endpointId: string) {
  for (const keyword of ["minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf"]) {
    const value = schema[keyword];
    if (value !== undefined && (typeof value !== "number" || !Number.isFinite(value))) {
      throw providerDocumentError(endpointId, `uses an invalid ${keyword} keyword`);
    }
  }
  if (typeof schema.multipleOf === "number" && schema.multipleOf <= 0) {
    throw providerDocumentError(endpointId, "uses a non-positive multipleOf keyword");
  }
  for (const keyword of ["minLength", "maxLength", "minItems", "maxItems", "minProperties", "maxProperties"]) {
    const value = schema[keyword];
    if (value !== undefined && (!Number.isInteger(value) || (value as number) < 0)) {
      throw providerDocumentError(endpointId, `uses an invalid ${keyword} keyword`);
    }
  }
  if (schema.uniqueItems !== undefined && typeof schema.uniqueItems !== "boolean") {
    throw providerDocumentError(endpointId, "uses an invalid uniqueItems keyword");
  }
  if (schema.pattern !== undefined && typeof schema.pattern !== "string") {
    throw providerDocumentError(endpointId, "uses an invalid pattern keyword");
  }
}

function resolveLocalObject(
  value: unknown,
  root: Record<string, unknown>,
  endpointId: string,
  refStack: Set<string>,
  budget: OpenApiNormalizationBudget,
  schemaReference = false,
): Record<string, unknown> {
  const record = requireRecord(value, endpointId, "referenced OpenAPI value");
  if (record.$ref === undefined) {
    return record;
  }
  const siblingKeys = Object.keys(record).filter((key) => key !== "$ref");
  if (
    typeof record.$ref !== "string" ||
    siblingKeys.some((key) => !isAllowedReferenceSibling(key, record[key], schemaReference))
  ) {
    throw providerDocumentError(endpointId, "contains an invalid $ref object");
  }
  const reference = record.$ref;
  if (!reference.startsWith("#/")) {
    throw providerDocumentError(endpointId, "contains an external $ref");
  }
  if (refStack.has(reference)) {
    throw providerDocumentError(endpointId, "contains a circular $ref");
  }
  budget.refResolutions += 1;
  if (budget.refResolutions > tikhubOpenApiMaxRefResolutions) {
    throw providerDocumentError(endpointId, "exceeds the OpenAPI reference-resolution limit");
  }
  refStack.add(reference);
  let current: unknown = root;
  for (const rawSegment of reference.slice(2).split("/")) {
    const segment = rawSegment.replaceAll("~1", "/").replaceAll("~0", "~");
    const currentRecord = requireRecord(current, endpointId, `reference ${reference}`);
    current = currentRecord[segment];
  }
  const resolved = requireRecord(current, endpointId, `reference ${reference}`);
  const resolvedValue: Record<string, unknown> =
    resolved.$ref === undefined
      ? resolved
      : resolveLocalObject(resolved, root, endpointId, refStack, budget, schemaReference);
  return Object.fromEntries([...Object.entries(resolvedValue), ...siblingKeys.map((key) => [key, record[key]])]);
}

function isAllowedReferenceSibling(key: string, value: unknown, schemaReference: boolean) {
  if (key === "summary" || key === "description") {
    return typeof value === "string";
  }
  if (!schemaReference) {
    return false;
  }
  if (
    key === "title" ||
    key === "example" ||
    key === "examples" ||
    key === "deprecated" ||
    key === "readOnly" ||
    key === "writeOnly" ||
    key === "externalDocs" ||
    key === "default" ||
    key.startsWith("x-")
  ) {
    return true;
  }
  return false;
}

function consumeSchemaBudget(budget: OpenApiNormalizationBudget, depth: number, endpointId: string) {
  if (depth > tikhubOpenApiMaxSchemaDepth) {
    throw providerDocumentError(endpointId, "exceeds the OpenAPI schema depth limit");
  }
  budget.schemaNodes += 1;
  if (budget.schemaNodes > tikhubOpenApiMaxSchemaNodes) {
    throw providerDocumentError(endpointId, "exceeds the OpenAPI schema node limit");
  }
}

function stripSchemaAnnotations(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripSchemaAnnotations);
  }
  if (!isRecord(value)) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "description" && !key.startsWith("x-"))
      .map(([key, child]) => [key, stripSchemaAnnotations(child)]),
  );
}

function stableJsonStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJsonStringify).join(",")}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJsonStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function readArray(value: unknown, endpointId: string, name: string) {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw providerDocumentError(endpointId, `${name} must be an array`);
  }
  return value;
}

function requireRecord(value: unknown, endpointId: string, name: string) {
  if (!isRecord(value)) {
    throw providerDocumentError(endpointId, `${name} must be an object`);
  }
  return value;
}

function requireJsonValue(
  value: unknown,
  endpointId: string,
  name: string,
  budget: OpenApiNormalizationBudget,
  depth: number,
): unknown {
  consumeSchemaBudget(budget, depth, endpointId);
  if (typeof value === "number") {
    return value;
  }
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((child) => requireJsonValue(child, endpointId, name, budget, depth + 1));
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, requireJsonValue(child, endpointId, name, budget, depth + 1)]),
    );
  }
  throw providerDocumentError(endpointId, `${name} is not valid JSON`);
}

function readNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function providerDocumentError(endpointId: string, reason: string) {
  return new ProviderRequestError(502, `TikHub OpenAPI operation ${endpointId} ${reason}`);
}
