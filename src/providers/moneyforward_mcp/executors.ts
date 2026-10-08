import type { CredentialValidators, ProviderExecutors } from "../../core/types.ts";

import { createProviderFetch, defineApiKeyProviderExecutors } from "../provider-runtime.ts";
import { moneyforwardService } from "./manifest.ts";
import { moneyforwardMcpActionHandlers, validateMoneyforwardMcpCredential } from "./runtime.ts";

// No proxy on purpose: a raw proxy could send any tools/call to Money Forward and bypass the
// office check, schema check and write-outcome handling the actions enforce.
export const executors: ProviderExecutors = defineApiKeyProviderExecutors(
  moneyforwardService,
  moneyforwardMcpActionHandlers,
);

export const credentialValidators: CredentialValidators = {
  apiKey(input, { fetcher, signal }) {
    return validateMoneyforwardMcpCredential(input.apiKey, createProviderFetch({ fetch: fetcher }), signal);
  },
};
