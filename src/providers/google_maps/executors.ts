import type { CredentialValidators, ProviderExecutors } from "../../core/types.ts";

import { defineApiKeyProviderExecutors } from "../provider-runtime.ts";
import { handlers, validateCredential } from "./runtime.ts";

export const executors: ProviderExecutors = defineApiKeyProviderExecutors("google_maps", handlers);

export const credentialValidators: CredentialValidators = {
  async apiKey(input, { fetcher, signal }) {
    return validateCredential(input, fetcher, signal);
  },
};
