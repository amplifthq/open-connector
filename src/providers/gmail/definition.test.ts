import { describe, expect, it } from "vitest";
import { buildActionSearchIndex, searchActions } from "../../core/action-search.ts";
import { provider } from "./definition.ts";

const gmailSettingsSharingScope = "https://www.googleapis.com/auth/gmail.settings.sharing";
const gmailSettingsBasicScope = "https://www.googleapis.com/auth/gmail.settings.basic";
const gmailReadonlyScope = "https://www.googleapis.com/auth/gmail.readonly";

describe("Gmail provider definition", () => {
  it("does not request the Workspace administrator-only sharing scope for user OAuth", () => {
    const oauth = provider.auth.find((auth) => auth.type === "oauth2");

    expect(oauth?.scopes).not.toContain(gmailSettingsSharingScope);
  });

  it("requests only read-only Gmail access for the OpenMeld production baseline", () => {
    const oauth = provider.auth.find((auth) => auth.type === "oauth2");

    expect(oauth?.scopes).toEqual([gmailReadonlyScope]);
  });

  it("uses a user-authorizable scope for forwarding read actions", () => {
    const forwardingReadActions = provider.actions.filter((action) =>
      ["get_auto_forwarding", "list_forwarding_addresses"].includes(action.name),
    );

    expect(forwardingReadActions).toHaveLength(2);
    for (const action of forwardingReadActions) {
      expect(action.requiredScopes).toEqual([gmailSettingsBasicScope]);
    }
  });

  it("makes unread inbox counts discoverable from natural language", () => {
    const index = buildActionSearchIndex(provider.actions);

    expect(
      searchActions(index, "unread inbox count", {
        limit: 10,
        service: "gmail",
      }).map((action) => action.id),
    ).toContain("gmail.fetch_emails");
  });
});
