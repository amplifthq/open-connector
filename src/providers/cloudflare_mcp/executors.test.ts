import { describe, expect, it, vi } from "vitest";
import { credentialValidators } from "./executors.ts";

const { callTool } = vi.hoisted(() => ({ callTool: vi.fn() }));
vi.mock("../mcp-client.ts", () => ({
  withMcpClient: async (_options: unknown, run: (client: unknown) => Promise<unknown>) =>
    run({ listTools: async () => ({ tools: [{ name: "docs" }, { name: "whoami" }] }), callTool }),
}));

describe("Cloudflare MCP identity", () => {
  it("keeps the same user identity when the token changes", async () => {
    callTool.mockResolvedValue({ content: [], structuredContent: { id: "user:user-1", email: "test@example.com" } });
    const first = await credentialValidators.apiKey!({ apiKey: "old-token", values: {} }, { fetcher: fetch });
    const second = await credentialValidators.apiKey!({ apiKey: "new-token", values: {} }, { fetcher: fetch });
    expect(first?.profile).toEqual({ accountId: "user:user-1", displayName: "test@example.com" });
    expect(second?.profile).toEqual(first?.profile);
    expect(callTool).toHaveBeenCalledWith({ name: "whoami", arguments: {} }, expect.any(Object));
  });
  it("accepts account identities in text results", async () => {
    callTool.mockResolvedValue({
      content: [{ type: "text", text: '{"id":"account:account-1","name":"Test account"}' }],
    });
    const result = await credentialValidators.apiKey!({ apiKey: "account-token", values: {} }, { fetcher: fetch });
    expect(result?.profile).toEqual({ accountId: "account:account-1", displayName: "Test account" });
  });
  it("rejects missing identity instead of inventing one from the token", async () => {
    callTool.mockResolvedValue({ content: [], structuredContent: {} });
    await expect(credentialValidators.apiKey!({ apiKey: "token", values: {} }, { fetcher: fetch })).rejects.toThrow(
      "stable account identity",
    );
  });
});
