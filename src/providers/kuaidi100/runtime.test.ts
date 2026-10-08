import { beforeEach, expect, test, vi } from "vitest";
import { kuaidi100ActionHandlers, kuaidi100McpEndpoint, validateKuaidi100Credential } from "./runtime.ts";

type AsyncMock = ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<unknown>>>;

const mockSdk = vi.hoisted(() => {
  let callToolImpl: AsyncMock = vi.fn();
  let listToolsImpl: AsyncMock = vi.fn();
  return {
    Client: function () {
      return {
        connect: vi.fn().mockResolvedValue(undefined),
        callTool: (...args: unknown[]) => callToolImpl(...args),
        listTools: (...args: unknown[]) => listToolsImpl(...args),
        close: vi.fn().mockResolvedValue(undefined),
      };
    },
    setCallToolImpl: (implementation: AsyncMock) => {
      callToolImpl = implementation;
    },
    getCallToolImpl: () => callToolImpl,
    setListToolsImpl: (implementation: AsyncMock) => {
      listToolsImpl = implementation;
    },
  };
});

const transport = vi.hoisted(() => ({ constructor: vi.fn() }));

vi.mock("@modelcontextprotocol/client", () => ({
  Client: mockSdk.Client,
  StreamableHTTPClientTransport: transport.constructor,
  SSEClientTransport: vi.fn(),
  ProtocolError: class extends Error {},
  SdkHttpError: class extends Error {},
  UnauthorizedError: class extends Error {},
}));

beforeEach(() => transport.constructor.mockClear());

test("validateKuaidi100Credential 通过官方 Streamable HTTP MCP 检查工具", async () => {
  mockSdk.setListToolsImpl(vi.fn().mockResolvedValue({ tools: [{ name: "query_trace" }] }));

  await expect(validateKuaidi100Credential("secret-key", vi.fn() as unknown as typeof fetch)).resolves.toMatchObject({
    profile: { accountId: expect.stringMatching(/^kuaidi100:mcp:[0-9a-f]{16}$/u) },
    metadata: { mcpEndpoint: kuaidi100McpEndpoint, discoveredToolCount: 1 },
  });

  const endpoint = transport.constructor.mock.calls[0]?.[0] as URL;
  expect(endpoint.origin + endpoint.pathname).toBe(kuaidi100McpEndpoint);
  expect(endpoint.searchParams.get("key")).toBe("secret-key");
});

test("auto_number 映射高层入参并解析远端文本 JSON", async () => {
  mockSdk.setCallToolImpl(
    vi.fn().mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            data: [{ comCode: "ems", name: "EMS", lengthPre: "12" }],
          }),
        },
      ],
      isError: false,
    }),
  );
  const fetcher = vi.fn() as unknown as typeof fetch;

  await expect(
    kuaidi100ActionHandlers.auto_number({ trackingNumber: "SF123" }, { apiKey: "secret-key", fetcher }),
  ).resolves.toEqual({
    data: [{ comCode: "ems", name: "EMS", lengthPre: "12" }],
  });
  expect(mockSdk.getCallToolImpl()).toHaveBeenCalledWith(
    { name: "auto_number", arguments: { kuaidiNum: "SF123", responseFormat: "json" } },
    { timeout: 60_000, signal: undefined },
  );
});

test("create_order 使用高层联系人结构并在内部注入 API key", async () => {
  mockSdk.setCallToolImpl(
    vi.fn().mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ data: { orderId: "1001" } }) }],
      isError: false,
    }),
  );
  const fetcher = vi.fn() as unknown as typeof fetch;

  await kuaidi100ActionHandlers.create_order(
    {
      carrier: "shunfeng",
      sender: { name: "寄件人", mobile: "13800000000", address: "深圳市南山区" },
      recipient: { name: "收件人", mobile: "13900000000", address: "北京市海淀区" },
      itemName: "文件",
    },
    { apiKey: "secret-key", fetcher },
  );

  expect(mockSdk.getCallToolImpl()).toHaveBeenCalledWith(
    {
      name: "create_order",
      arguments: expect.objectContaining({
        kuaidicom: "shunfeng",
        sendManName: "寄件人",
        sendManMobile: "13800000000",
        recManName: "收件人",
        cargo: "文件",
        key: "secret-key",
        responseFormat: "json",
      }),
    },
    { timeout: 60_000, signal: undefined },
  );
});
