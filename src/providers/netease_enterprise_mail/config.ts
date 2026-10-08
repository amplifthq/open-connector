import type { MailCredential } from "../../mail/imap-smtp/protocol.ts";
import type { MailRuntimeConfig } from "../../mail/imap-smtp/runtime.ts";

import { ProviderRequestError } from "../provider-runtime.ts";

export const neteaseEnterpriseMailRuntimeConfig: MailRuntimeConfig = {
  service: "netease_enterprise_mail",
  displayName: "NetEase Enterprise Mail",
  attachmentFallbackPrefix: "netease-enterprise-mail",
  connectAuthMessage:
    "Verify that NetEase Enterprise Mail IMAP/SMTP access is enabled and use the client authorization password instead of the web login password.",
  readCredential(values): MailCredential {
    const email = values.email?.trim() ?? "";
    const authorizationCode = values.authorizationCode?.trim() ?? "";
    const parts = email.split("@");
    const hasWhitespace = [...email].some((character) => character.trim().length === 0);
    if (parts.length !== 2 || !parts[0] || !parts[1] || hasWhitespace) {
      throw new ProviderRequestError(400, "NetEase Enterprise Mail email must be a valid email address.");
    }
    if (!authorizationCode) {
      throw new ProviderRequestError(400, "NetEase Enterprise Mail client authorization password must not be empty.");
    }
    return {
      email,
      authorizationCode,
      imapHost: "imaphz.qiye.163.com",
      smtpHost: "smtphz.qiye.163.com",
      smtpPort: 994,
      smtpSecure: true,
    };
  },
};
