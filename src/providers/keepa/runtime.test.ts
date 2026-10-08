import { describe, expect, it, vi } from "vitest";
import { keepaActionHandlers } from "./runtime.ts";

describe("Keepa product history", () => {
  it("normalizes monthly sales, coupons, and category sales ranks while skipping malformed tuples", async () => {
    const fetcher = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            products: [
              {
                asin: "B000TEST01",
                csv: [],
                monthlySoldHistory: [0, 100, Number.MAX_SAFE_INTEGER, 150, 1440, 200, "invalid"],
                couponHistory: [0, 200, -15, Number.MAX_SAFE_INTEGER, 100, -10, 60, 0, -7, 120, "invalid", 10],
                salesRanks: {
                  "172282": [0, 8000, Number.MAX_SAFE_INTEGER, 7750, 60, 7500],
                  invalid: [0, 1],
                },
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    );

    const result = await keepaActionHandlers.get_product_history(
      { marketplace: "US", asins: ["B000TEST01"] },
      { apiKey: "test-key", fetcher },
    );

    expect(result).toMatchObject({
      products: [
        {
          monthlySoldHistory: [
            { keepaTime: 0, timestamp: "2011-01-01T00:00:00.000Z", value: 100 },
            { keepaTime: 1440, timestamp: "2011-01-02T00:00:00.000Z", value: 200 },
          ],
          couponHistory: [
            {
              keepaTime: 0,
              timestamp: "2011-01-01T00:00:00.000Z",
              oneTimeCoupon: 200,
              subscribeAndSaveCoupon: -15,
            },
            {
              keepaTime: 60,
              timestamp: "2011-01-01T01:00:00.000Z",
              oneTimeCoupon: 0,
              subscribeAndSaveCoupon: -7,
            },
          ],
          salesRankHistory: [
            {
              categoryId: 172282,
              points: [
                { keepaTime: 0, timestamp: "2011-01-01T00:00:00.000Z", value: 8000 },
                { keepaTime: 60, timestamp: "2011-01-01T01:00:00.000Z", value: 7500 },
              ],
            },
          ],
        },
      ],
    });
  });
});
