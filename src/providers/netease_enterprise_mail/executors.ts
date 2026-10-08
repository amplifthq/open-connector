import type { CredentialValidators, ProviderExecutors } from "../../core/types.ts";

import { createMailProviderRuntime } from "../../mail/imap-smtp/runtime.ts";
import { neteaseEnterpriseMailRuntimeConfig } from "./config.ts";

const runtime = createMailProviderRuntime(neteaseEnterpriseMailRuntimeConfig);

export const executors: ProviderExecutors = runtime.executors;
export const credentialValidators: CredentialValidators = runtime.credentialValidators;
