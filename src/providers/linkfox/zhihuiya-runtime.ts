import { optionalNumber, optionalString } from "../../core/cast.ts";
import { ProviderRequestError } from "../provider-runtime.ts";

export function validateZhihuiyaInput(path: string, input: Record<string, unknown>): void {
  if (path.endsWith("/querySearchPatent")) {
    if ((optionalNumber(input.limit) ?? 10) + (optionalNumber(input.offset) ?? 0) > 20_000) {
      throw new ProviderRequestError(400, "limit + offset must not exceed 20000");
    }
    return;
  }
  if (path.endsWith("/patentImageSearch")) return;
  const id = optionalString(input.patentId);
  const number = optionalString(input.patentNumber);
  if (!id && !number) throw new ProviderRequestError(400, "patentId or patentNumber is required");
  const maximum = path.endsWith("/fulltextImage") ? 1 : path.endsWith("/abstractDataTranslated") ? undefined : 100;
  if (id) validateCommaList(id, "patentId", maximum);
  else if (number) validateCommaList(number, "patentNumber", maximum);
  if (!path.endsWith("/fulltextImage")) return;
  for (const field of ["limit", "offset"] as const) {
    const value = optionalString(input[field]);
    if (value === undefined) continue;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < (field == "limit" ? 1 : 0) || (field == "limit" && parsed > 100)) {
      throw new ProviderRequestError(
        400,
        `${field} must be a non-negative integer string${field == "limit" ? " between 1 and 100" : ""}`,
      );
    }
  }
}

function validateCommaList(value: string, field: string, maximum?: number): void {
  const values = value.split(",");
  if (values.some((item) => !item.trim()) || (maximum !== undefined && values.length > maximum)) {
    throw new ProviderRequestError(
      400,
      `${field} must contain non-empty comma-separated values${maximum === undefined ? "" : `, at most ${maximum}`}`,
    );
  }
}
