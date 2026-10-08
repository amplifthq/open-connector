import { describe, expect, it, vi } from "vitest";
import { ProviderRequestError } from "../provider-runtime.ts";
import { lacunaActionHandlers, lacunaBaseUrl } from "./runtime.ts";

describe("Lacuna provider runtime", () => {
  it("normalizes search aliases, query parameters, and Lacuna result URLs", async () => {
    const fetcher = vi.fn<typeof fetch>(async (request) => {
      const url = new URL(String(request));
      expect(url.pathname).toBe("/api/v1/search");
      expect(Object.fromEntries(url.searchParams)).toEqual({
        q: "autonomous agents",
        type: "cluster",
        limit: "5",
        offset: "0",
        sort: "relevance",
        ranking_profile: "default",
        fields: "title^4,top_names",
      });
      return Response.json({
        query: "autonomous agents",
        type_filter: "cluster",
        total_results: 1,
        results: [{ type: "cluster", id: "91", score: 1, url: "/direction/autonomous-agents/91" }],
      });
    });

    const output = await lacunaActionHandlers.search(
      { query: "autonomous agents", searchType: "directions", limit: 5, fields: "title^4,top_names" },
      { fetcher },
    );

    expect(fetcher).toHaveBeenCalledOnce();
    expect(output).toMatchObject({
      type_filter: "cluster",
      results: [{ url: `${lacunaBaseUrl}/direction/autonomous-agents/91` }],
    });
  });

  it("rejects unsupported semantic search combinations before sending a request", async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(
      lacunaActionHandlers.search(
        { query: "graph learning", searchType: "authors", rankingProfile: "semantic" },
        { fetcher },
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("accepts valid year, year-month, and calendar date bounds", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      Response.json({ query: "graph learning", type_filter: "all", total_results: 0, results: [] }),
    );

    const bounds = [
      { dateFrom: "0001", dateTo: "0001" },
      { dateFrom: "1900-02-28", dateTo: "1900-02" },
      { dateFrom: "2000-02-29", dateTo: "2000-12-31" },
      { dateFrom: "2024", dateTo: "2024-02" },
      { dateFrom: "2024-02-29", dateTo: "2024-12-31" },
      { dateFrom: "9999", dateTo: "9999-12-31" },
    ];
    for (const input of bounds) {
      await lacunaActionHandlers.search({ query: "graph learning", ...input }, { fetcher });
    }

    expect(fetcher).toHaveBeenCalledTimes(bounds.length);
  });

  it("rejects malformed and impossible calendar date bounds before sending a request", async () => {
    const fetcher = vi.fn<typeof fetch>();

    for (const input of [
      { query: "graph learning", dateFrom: "0000" },
      { query: "graph learning", dateFrom: "2024-00" },
      { query: "graph learning", dateTo: "2024-13" },
      { query: "graph learning", dateFrom: "2024-1" },
      { query: "graph learning", dateTo: "2024-01-1" },
      { query: "graph learning", dateFrom: "2024-01-00" },
      { query: "graph learning", dateTo: "2024-01-32" },
      { query: "graph learning", dateFrom: "1900-02-29" },
      { query: "graph learning", dateFrom: "2025-02-29" },
      { query: "graph learning", dateFrom: "2024-02-30" },
      { query: "graph learning", dateTo: "2025-04-31" },
    ]) {
      await expect(lacunaActionHandlers.search(input, { fetcher })).rejects.toMatchObject({ status: 400 });
    }
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects reversed inclusive date ranges while preserving partial-bound semantics", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      Response.json({ query: "graph learning", type_filter: "all", total_results: 0, results: [] }),
    );

    const validRanges = [
      { dateFrom: "2024", dateTo: "2024-01" },
      { dateFrom: "2024-12", dateTo: "2024" },
      { dateFrom: "2024-02-29", dateTo: "2024-02" },
      { dateFrom: "2024-02", dateTo: "2024-02-01" },
    ];
    for (const input of validRanges) {
      await lacunaActionHandlers.search({ query: "graph learning", ...input }, { fetcher });
    }

    for (const input of [
      { dateFrom: "2025", dateTo: "2024" },
      { dateFrom: "2024-03", dateTo: "2024-02" },
      { dateFrom: "2024-03-01", dateTo: "2024-02" },
      { dateFrom: "2024-02-02", dateTo: "2024-02-01" },
    ]) {
      await expect(
        lacunaActionHandlers.search({ query: "graph learning", ...input }, { fetcher }),
      ).rejects.toMatchObject({ status: 400 });
    }
    expect(fetcher).toHaveBeenCalledTimes(validRanges.length);
  });

  it("rejects lexical fields the searched type does not carry", async () => {
    const rejectingFetcher = vi.fn<typeof fetch>();

    for (const input of [
      { query: "graph learning", searchType: "author", fields: "abstract" },
      { query: "graph learning", searchType: "authors", fields: "name,title" },
      { query: "graph learning", searchType: "directions", fields: "summary" },
    ]) {
      await expect(lacunaActionHandlers.search(input, { fetcher: rejectingFetcher })).rejects.toMatchObject({
        status: 400,
      });
    }
    expect(rejectingFetcher).not.toHaveBeenCalled();

    const fetcher = vi.fn<typeof fetch>(async () =>
      Response.json({ query: "graph learning", type_filter: "cluster", total_results: 0, results: [] }),
    );

    await lacunaActionHandlers.search(
      { query: "graph learning", searchType: "directions", fields: "title^2,top_names" },
      { fetcher },
    );
    await lacunaActionHandlers.search({ query: "graph learning", fields: "abstract,name" }, { fetcher });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("rejects wrong-typed enum and alias inputs instead of silently using the default", async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(
      lacunaActionHandlers.get_paper({ paperIdOrUrl: "art_example123", view: 123 }, { fetcher }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      lacunaActionHandlers.search({ query: "graph learning", searchType: 123 }, { fetcher }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      lacunaActionHandlers.search({ query: "graph learning", venue: 123 }, { fetcher }),
    ).rejects.toMatchObject({ status: 400 });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("gets compact paper context and removes MCP-only metadata", async () => {
    const fetcher = vi.fn<typeof fetch>(async (request) => {
      const url = new URL(String(request));
      expect(url.pathname).toBe("/api/v1/context/paper/art_example123");
      expect(Object.fromEntries(url.searchParams)).toEqual({ view: "compact", figure_limit: "3" });
      return Response.json({
        type: "paper",
        id: "art_example123",
        url: "/paper/example/art_example123",
        summary_markdown: "See [direction](/direction/example/91).",
        _mcp_meta: { compact: true },
      });
    });

    const output = await lacunaActionHandlers.get_paper(
      { paperIdOrUrl: `${lacunaBaseUrl}/paper/example/art_example123`, figureLimit: 3 },
      { fetcher },
    );

    expect(output).toEqual({
      type: "paper",
      id: "art_example123",
      artifact_id: "art_example123",
      url: `${lacunaBaseUrl}/paper/example/art_example123`,
      summary_markdown: `See [direction](${lacunaBaseUrl}/direction/example/91).`,
    });
  });

  it("maps direction paper pagination and the full view", async () => {
    const fetcher = vi.fn<typeof fetch>(async (request) => {
      const url = new URL(String(request));
      expect(url.pathname).toBe("/api/v1/clusters/91/papers");
      expect(Object.fromEntries(url.searchParams)).toEqual({ page: "2", limit: "50", view: "complete" });
      return Response.json({ cluster_id: 91, papers: [] });
    });

    const output = await lacunaActionHandlers.get_direction_papers(
      { directionIdOrUrl: `${lacunaBaseUrl}/direction/autonomous-agents/91`, page: 2, limit: 50, view: "full" },
      { fetcher },
    );

    expect(output).toEqual({ cluster_id: 91, papers: [] });
  });

  it("maps full direction, author, and hypothesis routes from Lacuna URLs", async () => {
    const fetcher = vi.fn<typeof fetch>(async (request) => {
      const url = new URL(String(request));
      if (url.pathname === "/api/v1/clusters/91") return Response.json({ type: "direction", id: 91 });
      if (url.pathname === "/api/v1/context/author/aut_example") {
        expect(Object.fromEntries(url.searchParams)).toEqual({ include_neighbors: "true" });
        return Response.json({ type: "author", id: "aut_example" });
      }
      if (url.pathname === "/api/v1/hypotheses/db4199b6b8055f3e") {
        return Response.json({ type: "hypothesis", id: "db4199b6b8055f3e" });
      }
      throw new Error(`Unexpected Lacuna path: ${url.pathname}`);
    });

    await expect(
      lacunaActionHandlers.get_direction(
        { directionIdOrUrl: `${lacunaBaseUrl}/direction/example/91`, view: "full" },
        { fetcher },
      ),
    ).resolves.toMatchObject({ cluster_id: 91 });
    await expect(
      lacunaActionHandlers.get_author_context(
        { authorIdOrUrl: `${lacunaBaseUrl}/author/example/aut_example`, view: "full", includeNeighbors: true },
        { fetcher },
      ),
    ).resolves.toMatchObject({ author_id: "aut_example" });
    await expect(
      lacunaActionHandlers.get_hypothesis(
        {
          hypothesisIdOrUrl: `${lacunaBaseUrl}/hypothesis/spectral-hydrodynamics-of-heteropolymer-folding-DB4199B6B8055F3E`,
          view: "full",
        },
        { fetcher },
      ),
    ).resolves.toMatchObject({ hypothesis_id: "db4199b6b8055f3e" });
  });

  it("accepts the fused direction and hypothesis URLs Lacuna search returns", async () => {
    const fetcher = vi.fn<typeof fetch>(async (request) => {
      const url = new URL(String(request));
      if (url.pathname === "/api/v1/context/direction/21526") return Response.json({ type: "direction", id: 21526 });
      if (url.pathname === "/api/v1/context/hypothesis/db4199b6b8055f3e") {
        return Response.json({ type: "hypothesis", id: "db4199b6b8055f3e" });
      }
      throw new Error(`Unexpected Lacuna path: ${url.pathname}`);
    });

    const directionUrls = [
      "/direction/trajectory-controllable-video-diffusion-21526",
      `${lacunaBaseUrl}/direction/trajectory-controllable-video-diffusion-21526`,
      `${lacunaBaseUrl}/direction/trajectory-controllable-video-diffusion-21526/md`,
      `${lacunaBaseUrl}/cluster/trajectory-controllable-video-diffusion-21526`,
      "21526",
      `${lacunaBaseUrl}/direction/autonomous-agents/21526`,
    ];
    for (const directionIdOrUrl of directionUrls) {
      await expect(lacunaActionHandlers.get_direction({ directionIdOrUrl }, { fetcher })).resolves.toMatchObject({
        cluster_id: 21526,
      });
    }

    const hypothesisUrls = [
      "/hypothesis/spectral-hydrodynamics-of-heteropolymer-folding-db4199b6b8055f3e",
      `${lacunaBaseUrl}/hypothesis/spectral-hydrodynamics-of-heteropolymer-folding-db4199b6b8055f3e/md`,
      "db4199b6b8055f3e",
    ];
    for (const hypothesisIdOrUrl of hypothesisUrls) {
      await expect(lacunaActionHandlers.get_hypothesis({ hypothesisIdOrUrl }, { fetcher })).resolves.toMatchObject({
        hypothesis_id: "db4199b6b8055f3e",
      });
    }
    expect(fetcher).toHaveBeenCalledTimes(directionUrls.length + hypothesisUrls.length);
  });

  it("rejects identifiers Lacuna itself cannot address", async () => {
    const fetcher = vi.fn<typeof fetch>();

    for (const input of [
      lacunaActionHandlers.get_direction(
        { directionIdOrUrl: `${lacunaBaseUrl}/direction/txn_ab12cd34ef` },
        { fetcher },
      ),
      lacunaActionHandlers.get_direction({ directionIdOrUrl: "/direction/txn_ab12cd34ef" }, { fetcher }),
      lacunaActionHandlers.get_hypothesis({ hypothesisIdOrUrl: `${lacunaBaseUrl}/hypothesis/example` }, { fetcher }),
      lacunaActionHandlers.get_author_context({ authorIdOrUrl: ".." }, { fetcher }),
      lacunaActionHandlers.get_author_context({ authorIdOrUrl: "author/.." }, { fetcher }),
      lacunaActionHandlers.get_author_context({ authorIdOrUrl: "author/%" }, { fetcher }),
      lacunaActionHandlers.get_author_context({ authorIdOrUrl: `${lacunaBaseUrl}/author/%` }, { fetcher }),
    ]) {
      await expect(input).rejects.toMatchObject({ status: 400 });
    }
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects foreign URLs before sending a request", async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(
      lacunaActionHandlers.get_paper({ paperIdOrUrl: "https://example.com/paper/x/art_example123" }, { fetcher }),
    ).rejects.toMatchObject({ status: 400 });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("preserves useful upstream client errors", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => Response.json({ detail: "Paper not found" }, { status: 404 }));

    await expect(lacunaActionHandlers.get_paper({ paperIdOrUrl: "art_missing" }, { fetcher })).rejects.toEqual(
      expect.objectContaining<Partial<ProviderRequestError>>({ status: 404, message: "Paper not found" }),
    );
  });

  it("keeps the upstream status when a gateway returns a non-JSON error page", async () => {
    const fetcher = vi.fn<typeof fetch>(
      async () =>
        new Response("<html><body>404 Not Found</body></html>", {
          status: 404,
          headers: { "content-type": "text/html" },
        }),
    );

    await expect(lacunaActionHandlers.get_paper({ paperIdOrUrl: "art_missing" }, { fetcher })).rejects.toMatchObject({
      status: 404,
    });
  });

  it("retries retryable Lacuna statuses and surfaces the final failure", async () => {
    const statuses = [429, 200];
    const fetcher = vi.fn<typeof fetch>(async () => {
      const status = statuses.shift() ?? 200;
      return status === 200
        ? Response.json({ type: "paper", id: "art_example123" })
        : Response.json({ detail: "Slow down" }, { status, headers: { "retry-after": "30" } });
    });
    const sleep = vi.fn(async () => {});

    await expect(
      lacunaActionHandlers.get_paper({ paperIdOrUrl: "art_example123" }, { fetcher, sleep }),
    ).resolves.toMatchObject({ artifact_id: "art_example123" });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledOnce();

    const alwaysThrottled = vi.fn<typeof fetch>(async () => Response.json({ detail: "Slow down" }, { status: 429 }));

    await expect(
      lacunaActionHandlers.get_paper({ paperIdOrUrl: "art_example123" }, { fetcher: alwaysThrottled, sleep }),
    ).rejects.toMatchObject({ status: 429, message: "Slow down" });
    expect(alwaysThrottled).toHaveBeenCalledTimes(3);
  });

  it("absolutizes only same-origin Lacuna links in Markdown and URL fields", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      Response.json({
        type: "paper",
        id: "art_example123",
        url: "//evil.example/paper/art_example123",
        markdown_url: "/paper/art_example123/md",
        canonical_url: "https://arxiv.org/abs/2401.12345",
        summary_markdown: [
          "See [paper](/paper/art_example123) and [author](/author/aut_example).",
          "The preprint lives at https://arxiv.org/pdf/2401.12345 today.",
          "Trailing punctuation stays outside the link: /direction/trajectory-controllable-video-diffusion-21526,",
        ].join("\n"),
      }),
    );

    const output = await lacunaActionHandlers.get_paper({ paperIdOrUrl: "art_example123", view: "full" }, { fetcher });

    expect(output).toMatchObject({
      url: "//evil.example/paper/art_example123",
      markdown_url: `${lacunaBaseUrl}/paper/art_example123/md`,
      canonical_url: "https://arxiv.org/abs/2401.12345",
      summary_markdown: [
        `See [paper](${lacunaBaseUrl}/paper/art_example123) and [author](${lacunaBaseUrl}/author/aut_example).`,
        "The preprint lives at https://arxiv.org/pdf/2401.12345 today.",
        `Trailing punctuation stays outside the link: ${lacunaBaseUrl}/direction/trajectory-controllable-video-diffusion-21526,`,
      ].join("\n"),
    });
  });

  it("drops an upstream __proto__ key instead of poisoning the returned record", async () => {
    const fetcher = vi.fn<typeof fetch>(
      async () =>
        new Response(
          '{"query":"graph learning","type_filter":"all","total_results":0,"results":[],"__proto__":{"polluted":true}}',
          { headers: { "content-type": "application/json" } },
        ),
    );

    const output = (await lacunaActionHandlers.search({ query: "graph learning" }, { fetcher })) as Record<
      string,
      unknown
    >;

    expect(Object.hasOwn(output, "__proto__")).toBe(false);
    expect(Object.getPrototypeOf(output)).toBe(Object.prototype);
    expect((output as { polluted?: unknown }).polluted).toBeUndefined();
    expect(({} as { polluted?: unknown }).polluted).toBeUndefined();
  });

  it("reports open-ended integer bounds without the maximum safe integer", async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(lacunaActionHandlers.search({ query: "graph learning", offset: -1 }, { fetcher })).rejects.toEqual(
      expect.objectContaining<Partial<ProviderRequestError>>({
        status: 400,
        message: "offset must be an integer greater than or equal to 0.",
      }),
    );
    await expect(lacunaActionHandlers.search({ query: "graph learning", limit: 0 }, { fetcher })).rejects.toEqual(
      expect.objectContaining<Partial<ProviderRequestError>>({
        status: 400,
        message: "limit must be an integer between 1 and 50.",
      }),
    );
    expect(fetcher).not.toHaveBeenCalled();
  });
});
