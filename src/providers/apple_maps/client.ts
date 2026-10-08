import { looseArray, optionalRecord, optionalString } from "../../core/cast.ts";
import { ProviderRequestError } from "../provider-runtime.ts";

/** The sole Apple Maps Server API origin. */
export const appleMapsApiOrigin = "https://maps-api.apple.com";

/**
 * Endpoint that exchanges a Maps auth token for a Maps access token.
 *
 * It returns a bearer credential accepted by every business endpoint, so it remains internal to
 * the runtime and is exposed through neither an action nor the proxy allowlist.
 */
export const appleMapsTokenPath = "/v1/token";

/** Provider name used in shared timeout and transport-failure messages. */
export const appleMapsProviderLabel = "Apple Maps";

/**
 * Whether a failure occurred during credential validation or action and proxy execution.
 *
 * A 401 from /v1/token during validation means the key was rejected and maps to a connection-form
 * field error. Other validation statuses and all execution statuses preserve the upstream status;
 * a bare 401 or 403 is insufficient evidence to tell the user to reauthorize.
 */
export type AppleMapsPhase = "execute" | "validate";

const rejectedKeyMessage =
  "Apple Maps rejected the key. Check the Team ID, Key ID and private key, and check that the key has MapKit JS enabled and is associated with a Maps ID.";

export async function readAppleMapsPayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    // Gateway failures may be plain text; preserve it and let error mapping fall back to HTTP status.
    return text;
  }
}

/**
 * Map an Apple Maps failure response to ProviderRequestError.
 *
 * Every branch attaches the parsed response body as data. Execution-phase 401 and 403 responses
 * remain provider errors with their upstream status. Apple's generic 401 documentation and the
 * observed "Not Authorized" body cannot distinguish a revoked key, missing MapKit JS access, or
 * clock skew, so they do not justify prompting reauthorization.
 *
 * Only a validation-phase 401 is reported as a rejected key. /v1/token documents 200, 401, 429,
 * and 500, and tests on 2026-09-11 returned 401 JSON for an unknown or missing key ID, expiry, and
 * wrong scope. No documentation or observation ties 403 to a bad key, so retain its provider error
 * and status rather than risk prompting revocation of a valid, one-time-download .p8 key.
 */
export function createAppleMapsError(status: number, payload: unknown, phase: AppleMapsPhase): ProviderRequestError {
  if (phase === "validate" && status === 401) {
    return new ProviderRequestError(400, rejectedKeyMessage, payload);
  }

  const message = readAppleMapsErrorMessage(status, payload);
  if (status === 429) {
    return new ProviderRequestError(429, message, payload);
  }
  if (status === 401 || status === 403) {
    return new ProviderRequestError(status, message, payload);
  }
  if (status >= 400 && status < 500) {
    return new ProviderRequestError(status, message, payload);
  }
  return new ProviderRequestError(500 <= status && status < 600 ? status : 502, message, payload);
}

/**
 * Compose the message and details from an error body.
 *
 * The documented ErrorResponse is `{ message, details }`, while production has returned
 * `{ error: { message, details } }`. Accept both shapes.
 */
function readAppleMapsErrorMessage(status: number, payload: unknown): string {
  const body = optionalRecord(payload) ?? {};
  const error = optionalRecord(body.error) ?? body;
  const details = looseArray(error.details).flatMap((detail) => {
    const text = optionalString(detail);
    return text ? [text] : [];
  });
  const summary = [optionalString(error.message), details.join("; ")].filter((part) => part).join(": ");

  return summary || `Apple Maps request failed with HTTP ${status}`;
}
