import { describe, it, expect, beforeEach } from "vitest";
import { staticMap, type StaticMapParams } from "./staticMaps.js";
import { server } from "../test/setup.js";
import { http, HttpResponse } from "msw";
import { staticMapFixture } from "../test/fixtures/staticMap.js";

describe("Static Maps Tools", () => {
  describe("staticMap", () => {
    it("should generate a static map with a route", async () => {
      const params: StaticMapParams = {
        encodedPolyline: "u{~vFvyys@fS]",
        strokeColor: "blue",
        strokeWidth: 5,
      };

      const result = await staticMap(params);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0]).toHaveProperty("type", "image");
      expect(result.content[0]).toHaveProperty("data");
      expect(result.content[0]).toHaveProperty("mimeType", "image/png");
    });
  });

  describe("Error handling", () => {
    it("should handle API errors gracefully", async () => {
      // Override the default handler for this test to return an error
      server.use(
        http.post("https://tiles.stadiamaps.com/static_cacheable/*", () => {
          return HttpResponse.json(
            { error: "Invalid request parameters" },
            { status: 400 },
          );
        }),
      );

      const params: StaticMapParams = {
        markers: [
          {
            lat: 37.7749,
            lon: -122.4194,
          },
        ],
      };

      const result = await staticMap(params);

      expect(result).toBeDefined();
      expect(result.content[0]).toHaveProperty("type", "text");
      expect(result.content[0].text).toContain(
        "Failed to generate static map:",
      );
    });
  });
});
