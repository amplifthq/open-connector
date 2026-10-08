import { describe, expect, it } from "vitest";
import {
  decodeNotionToolText,
  parseNotionComments,
  parseNotionPage,
  parseNotionSearch,
  parseNotionSelf,
  parseNotionToolAccess,
} from "./mcp-response.ts";

describe("Notion MCP response readers", () => {
  it("decodes JSON text blocks and keeps prose as text", () => {
    expect(decodeNotionToolText(' {"results":[]} ')).toEqual({ results: [] });
    expect(decodeNotionToolText("[1]")).toEqual([1]);
    expect(decodeNotionToolText("{not json")).toBe("{not json");
    expect(decodeNotionToolText("Here is the page")).toBe("Here is the page");
  });

  it("reads the connected user from the recorded notion-get-users shape", () => {
    const value = { results: [{ type: "person", id: "u-1", name: "Ada", email: "ada@example.com" }], has_more: false };
    expect(parseNotionSelf(value)).toEqual({ type: "person", id: "u-1", name: "Ada", email: "ada@example.com" });
    expect(parseNotionSelf({ results: [{ type: "bot" }, { id: "u-2" }] })).toEqual({ id: "u-2" });
    expect(parseNotionSelf({ results: [] })).toBeUndefined();
    expect(parseNotionSelf("no users")).toBeUndefined();
  });

  it("reads the connected user when notion-get-users answers a single user object", () => {
    expect(parseNotionSelf({ object: "user", type: "person", id: "u-3", name: "Grace" })).toEqual({
      type: "person",
      id: "u-3",
      name: "Grace",
    });
    expect(parseNotionSelf({ type: "bot" })).toBeUndefined();
    expect(parseNotionSelf({ unexpected: true })).toBeUndefined();
  });

  it("reads search results with absent fields absent and notices as text", () => {
    const value = {
      type: "workspace_search",
      results: [
        {
          id: "p-1",
          title: "Roadmap",
          url: "https://www.notion.so/p-1",
          type: "page",
          timestamp: "2026-09-25T10:00:00.000Z",
          path: "Wiki / Roadmap",
        },
        { id: "p-2", properties: { title: { title: [{ plain_text: "Rich " }, { plain_text: "title" }] } } },
        { id: "p-3", last_edited_time: "2026-09-24T00:00:00.000Z" },
        "not a record",
      ],
      notices: ["filters.edited_by_user_ids requires a Business plan", { parameter: "filters.created_date_range" }, 7],
    };
    expect(parseNotionSearch(value)).toEqual({
      type: "workspace_search",
      results: [
        {
          id: "p-1",
          title: "Roadmap",
          url: "https://www.notion.so/p-1",
          type: "page",
          timestamp: "2026-09-25T10:00:00.000Z",
          path: "Wiki / Roadmap",
        },
        { id: "p-2", title: "Rich title" },
        { id: "p-3", timestamp: "2026-09-24T00:00:00.000Z" },
      ],
      notices: ["filters.edited_by_user_ids requires a Business plan", "filters.created_date_range"],
    });
    expect(parseNotionSearch({ type: "ai_search", pages: [{ id: "p-4" }], notices: "one sentence" })).toEqual({
      type: "ai_search",
      results: [{ id: "p-4" }],
      notices: ["one sentence"],
    });
    expect(parseNotionSearch("no results")).toEqual({ type: undefined, results: [], notices: [] });
  });

  it("reads the page envelope from the text form, unescaping entities and keeping the truncated mark", () => {
    const text = [
      "Here is the result of the fetch:",
      '<page url="https://www.notion.so/p-1" title="Roadmap &amp; plan"><properties>Status: Draft</properties>',
      '<content truncated="true"># Roadmap\n\nQ4 &amp; beyond &lt;soon&gt; &#39;quoted&#x27;</content></page>',
    ].join("\n");
    expect(parseNotionPage(text)).toEqual({
      title: "Roadmap & plan",
      url: "https://www.notion.so/p-1",
      properties: "Status: Draft",
      content: "# Roadmap\n\nQ4 & beyond <soon> 'quoted'",
      truncated: true,
    });
  });

  it("reads the page envelope from the object form and prefers the object's own fields", () => {
    expect(
      parseNotionPage({
        title: "Roadmap",
        url: "https://www.notion.so/p-1",
        page_last_edited_at: "2026-09-25T10:00:00.000Z",
        truncated: false,
        text: '<page url="https://ignored.example" truncated="true"><content>Body</content></page>',
      }),
    ).toEqual({
      title: "Roadmap",
      url: "https://www.notion.so/p-1",
      page_last_edited_at: "2026-09-25T10:00:00.000Z",
      content: "Body",
      truncated: true,
    });
  });

  it("keeps numeric entities past U+10FFFF as text instead of throwing", () => {
    expect(parseNotionPage("<content>a &#x110000; b &#99999999; c &#x1F600;</content>")).toEqual({
      content: "a &#x110000; b &#99999999; c \u{1F600}",
      truncated: false,
    });
    expect(parseNotionComments('<comment id="c-9">x &#9999999999999999999999; y</comment>')).toEqual([
      { id: "c-9", plain_text: "x &#9999999999999999999999; y" },
    ]);
  });

  it("scans crafted unclosed tags and attribute runs in linear time", () => {
    const crafted = [
      "<comment>".repeat(40_000),
      "<discussion>".repeat(40_000),
      `<comment ${"a".repeat(200_000)}>x</comment>`,
      `<comment>${"<".repeat(200_000)}</comment>`,
    ];
    const started = performance.now();
    for (const text of crafted) parseNotionComments(text);
    parseNotionPage("<page ".repeat(40_000));
    parseNotionPage("<properties>".repeat(40_000));
    // The previous lazy patterns took tens of seconds on these; a linear scan takes milliseconds.
    expect(performance.now() - started).toBeLessThan(1_000);
  });

  it("takes an unclosed content block to the end and a bare answer whole", () => {
    expect(parseNotionPage("<page><content>Cut off mid")).toEqual({ content: "Cut off mid", truncated: false });
    expect(parseNotionPage("Just markdown")).toEqual({ content: "Just markdown", truncated: false });
    expect(parseNotionPage({ metadata: {} })).toEqual({ truncated: false });
    expect(parseNotionPage(42)).toEqual({ truncated: false });
  });

  it("flattens structured discussions and reads the XML twin", () => {
    expect(
      parseNotionComments({
        discussions: [
          {
            id: "d-1",
            comments: [
              {
                id: "c-1",
                plain_text: "Looks good",
                created_time: "2026-09-25T11:00:00.000Z",
                created_by: { id: "u-1", name: "Ada" },
              },
              { id: "c-2", text: "Agreed", author_id: "u-2", author: "Bob" },
              { discussion_id: "d-9", body: "" },
            ],
          },
        ],
        comments: [{ id: "c-0", plain_text: "Flat" }],
      }),
    ).toEqual([
      { id: "c-0", plain_text: "Flat" },
      {
        id: "c-1",
        discussion_id: "d-1",
        plain_text: "Looks good",
        created_time: "2026-09-25T11:00:00.000Z",
        created_by: { id: "u-1", name: "Ada" },
      },
      { id: "c-2", discussion_id: "d-1", plain_text: "Agreed", created_by: { id: "u-2", name: "Bob" } },
    ]);
    const xml =
      '<discussion id="d-2"><comment id="c-3" author="Ada" author_id="u-1" created_time="2026-09-24T09:00:00.000Z">Please <b>review</b> &amp; sign</comment></discussion>' +
      '<comment id="c-4" discussion_id="d-3">Outside</comment>';
    const expected = [
      {
        id: "c-3",
        discussion_id: "d-2",
        plain_text: "Please review & sign",
        created_time: "2026-09-24T09:00:00.000Z",
        created_by: { id: "u-1", name: "Ada" },
      },
      { id: "c-4", discussion_id: "d-3", plain_text: "Outside" },
    ];
    expect(parseNotionComments(xml)).toEqual(expected);
    expect(parseNotionComments({ text: xml })).toEqual(expected);
    expect(parseNotionComments({ discussions: [] })).toEqual([]);
    expect(parseNotionComments(null)).toEqual([]);
  });

  it("reads the documented tool-access map, keeping unrestricted tools and each restriction's reason", () => {
    const documented = {
      current_tool_access: {
        search: {
          status: "available",
          restricted_parameters: {
            "filters.edited_by_user_ids": "Requires a Business or Enterprise plan.",
            "filters.teamspace_ids": { detail: "Multiple teamspaces require Business." },
          },
          upgrade_url: "https://www.notion.so/upgrade",
        },
        ai_search: {
          status: "plan_required",
          landing_page_url: "https://www.notion.so/ai",
          landing_page_action: "start_trial",
        },
        fetch: { status: "available" },
        broken: "text",
      },
    };
    expect(parseNotionToolAccess(documented)).toEqual([
      {
        tool: "search",
        status: "available",
        restricted_parameters: [
          { parameter: "filters.edited_by_user_ids", reason: "Requires a Business or Enterprise plan." },
          { parameter: "filters.teamspace_ids", reason: '{"detail":"Multiple teamspaces require Business."}' },
        ],
        upgrade_url: "https://www.notion.so/upgrade",
      },
      {
        tool: "ai_search",
        status: "plan_required",
        restricted_parameters: [],
        landing_page_url: "https://www.notion.so/ai",
        landing_page_action: "start_trial",
      },
      { tool: "fetch", status: "available", restricted_parameters: [] },
    ]);
    expect(parseNotionToolAccess({ current_tool_access: {} })).toEqual([]);
    expect(parseNotionToolAccess({ current_tool_access: [{ tool: "search" }] })).toEqual([]);
    expect(parseNotionToolAccess("nothing")).toEqual([]);
  });
});
