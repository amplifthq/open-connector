import { decodeJwt } from "jose";
import { looseArray, optionalRecord } from "../../core/cast.ts";
import { ProviderRequestError } from "../provider-runtime.ts";

export function decodeJwsPayload(value: unknown, label: string): Record<string, unknown> {
  const payload = decodeOptionalJwsPayload(value, label);
  if (payload === null) {
    throw new ProviderRequestError(502, `${label} is missing from the response`, undefined, "provider_error");
  }
  return payload;
}

export function decodeOptionalJwsPayload(value: unknown, label: string): Record<string, unknown> | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    throw new ProviderRequestError(502, `${label} must be a JWS string`, undefined, "provider_error");
  }

  try {
    return decodeJwt(value);
  } catch {
    throw new ProviderRequestError(
      502,
      `${label} is not a decodable JWS returned by the App Store Server API`,
      undefined,
      "provider_error",
    );
  }
}

export function decodeJwsPayloadList(value: unknown, label: string): Array<Record<string, unknown>> {
  return looseArray(value).map((item) => decodeJwsPayload(item, label));
}

function decodeNotificationPayload(value: unknown, label: string): Record<string, unknown> {
  const notification = decodeJwsPayload(value, label);
  const data = optionalRecord(notification.data);
  if (data) {
    notification.data = decodeSignedFields(data, `${label} data`, {
      signedTransactionInfo: "transactionInfo",
      signedRenewalInfo: "renewalInfo",
    });
  }
  const appData = optionalRecord(notification.appData);
  if (appData) {
    notification.appData = decodeSignedFields(appData, `${label} appData`, {
      signedAppTransactionInfo: "appTransactionInfo",
    });
  }

  return notification;
}

export function decodeOptionalNotificationPayload(value: unknown, label: string): Record<string, unknown> | null {
  return value === undefined || value === null || value === "" ? null : decodeNotificationPayload(value, label);
}

function decodeSignedFields(
  source: Record<string, unknown>,
  label: string,
  fields: Record<string, string>,
): Record<string, unknown> {
  const decoded: Record<string, unknown> = { ...source };
  for (const [signedKey, decodedKey] of Object.entries(fields)) {
    decoded[decodedKey] = decodeOptionalJwsPayload(source[signedKey], `${label} ${signedKey}`);
    delete decoded[signedKey];
  }

  return decoded;
}
