import { optionalString } from "../../../core/cast.ts";
import { providerResponseError } from "../../provider-runtime.ts";

export function requireFeishuResponseString(value: unknown, field: string): string {
  const text = optionalString(value)?.trim();
  if (text) return text;
  throw providerResponseError(`Feishu response is missing ${field}`);
}

export function requireFeishuResponseId(value: unknown, field: string): string {
  if (typeof value === "number") {
    if (Number.isSafeInteger(value)) return String(value);
    throw providerResponseError(`Feishu response has an invalid ${field}`);
  }
  return requireFeishuResponseString(value, field);
}
