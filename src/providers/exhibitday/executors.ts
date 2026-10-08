import type { CredentialValidators, ProviderExecutors, ProviderProxyExecutor } from "../../core/types.ts";

import { defineApiKeyProviderExecutors, defineProviderProxy } from "../provider-runtime.ts";
import { exhibitdayApiBaseUrl, handlers, validateCredential } from "./runtime.ts";

const service = "exhibitday";
export const executors: ProviderExecutors = defineApiKeyProviderExecutors(service, handlers, {
  skipDnsValidation: true,
});
export const proxy: ProviderProxyExecutor = defineProviderProxy({
  service,
  baseUrl: exhibitdayApiBaseUrl,
  auth: { type: "api_key_header", name: "api_key" },
  skipDnsValidation: true,
});
export const credentialValidators: CredentialValidators = {
  apiKey(input, { fetcher, signal }) {
    return validateCredential(input.apiKey, fetcher, signal);
  },
};
