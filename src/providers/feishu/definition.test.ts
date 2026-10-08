import type { ActionDefinition } from "../../core/types.ts";

import { describe, expect, it } from "vitest";
import { provider } from "./definition.ts";

function action(name: string): ActionDefinition {
  const found = provider.actions.find((candidate) => candidate.name === name);
  expect(found, `${name} must remain in the Feishu catalog`).toBeDefined();
  return found!;
}

describe("Feishu provider definition", () => {
  it("requests the provider-enforced folder-list permission", () => {
    expect(action("list_drive_files").requiredScopes).toEqual(["space:document:retrieve"]);
    expect(action("list_drive_files").providerPermissions).toEqual(["space:document:retrieve"]);
  });

  // The one of the three with no guard until now, and the most consequential:
  // `docs:permission.member:readonly` is refused outright, so
  // `list_drive_permissions` could not be CALLED — every Feishu document ACL
  // read failed at the gate rather than returning something wrong.
  it("requests the provider-enforced permission-member read permission", () => {
    expect(action("list_drive_permissions").requiredScopes).toEqual(["docs:permission.member:retrieve"]);
    expect(action("list_drive_permissions").providerPermissions).toEqual(["docs:permission.member:retrieve"]);
  });

  // `permissionResourceSchema` used to pass `optional: []`, and an empty
  // array is truthy for `s.object`, so `fields` and `permType` were required
  // and a caller that supplied only the resource was rejected before the
  // request was even built.
  it("requires only the resource for the permission actions", () => {
    expect(action("list_drive_permissions").inputSchema.required).toEqual(["token", "resourceType"]);
    expect(action("add_drive_permission").inputSchema.required).toEqual([
      "token",
      "resourceType",
      "memberId",
      "memberType",
      "permission",
    ]);
    expect(action("update_drive_permission").inputSchema.required).toEqual([
      "token",
      "resourceType",
      "memberId",
      "memberType",
      "permission",
    ]);
    expect(action("remove_drive_permission").inputSchema.required).toEqual([
      "token",
      "resourceType",
      "memberId",
      "memberType",
    ]);
  });

  it("requests the provider-enforced wiki-node read permission", () => {
    expect(action("get_wiki_node").requiredScopes).toEqual(["wiki:node:read"]);
    expect(action("get_wiki_node").providerPermissions).toEqual(["wiki:node:read"]);
  });
});
