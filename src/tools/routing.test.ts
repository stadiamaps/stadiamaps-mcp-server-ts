import { describe, it, expect } from "vitest";
import { routeOverview, type RouteOverviewParams } from "./routing.js";
import { CostingModel, DistanceUnit } from "@stadiamaps/api";
import { server } from "../test/setup.js";
import { http, HttpResponse } from "msw";
import { routeErrorFixture } from "../test/fixtures/routeError.js";

describe("Routing Tools", () => {
  describe("routeOverview", () => {
    it("should calculate a route between two points", async () => {
      const params: RouteOverviewParams = {
        locations: [
          { lat: 37.7749, lon: -122.4194 }, // San Francisco
          { lat: 37.7849, lon: -122.4094 }, // Nearby point
        ],
        costing: CostingModel.Auto,
        units: DistanceUnit.Km,
      };

      const result = await routeOverview(params);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0]).toHaveProperty("type", "text");
      expect(result.content[0].text).toContain("Travel distance:");
      expect(result.content[0].text).toContain("Travel time:");
      expect(result.content[0].text).toContain("BBOX");
      expect(result.content[0].text).toContain("Polyline");
    });

    it("should format travel time correctly for short durations", async () => {
      // This test assumes the mock returns 1200 seconds (20 minutes)
      const params: RouteOverviewParams = {
        locations: [
          { lat: 37.7749, lon: -122.4194 },
          { lat: 37.7849, lon: -122.4094 },
        ],
        costing: CostingModel.Auto,
        units: DistanceUnit.Km,
      };

      const result = await routeOverview(params);

      expect(result.content[0].text).toContain("less than a minute");
      expect(result.content[0].text).toContain(
        "[-149.54858, 60.534715, -149.543469, 60.535008]",
      );
    });

    it("should include bounding box information", async () => {
      const params: RouteOverviewParams = {
        locations: [
          { lat: 37.7749, lon: -122.4194 },
          { lat: 37.7849, lon: -122.4094 },
        ],
        costing: CostingModel.Auto,
        units: DistanceUnit.Km,
      };

      const result = await routeOverview(params);

      expect(result.content[0].text).toContain(
        "[-149.54858, 60.534715, -149.543469, 60.535008]",
      );
    });

    it("should include encoded polyline", async () => {
      const params: RouteOverviewParams = {
        locations: [
          { lat: 37.7749, lon: -122.4194 },
          { lat: 37.7849, lon: -122.4094 },
        ],
        costing: CostingModel.Auto,
        units: DistanceUnit.Km,
      };

      const result = await routeOverview(params);

      expect(result.content[0].text).toContain(
        "wzvmrBxalf|GcCrX}A|Nu@jI}@pMkBtZ{@x^_Afj@Inn@`@veB",
      );
    });
  });

  describe("Error handling", () => {
    it("should handle API errors gracefully", async () => {
      // Override the default handler for this test to return an error
      server.use(
        http.post("https://api.stadiamaps.com/route/v1", () => {
          return HttpResponse.json(routeErrorFixture, { status: 400 });
        }),
      );

      const params: RouteOverviewParams = {
        locations: [
          { lat: 37.7749, lon: -122.4194 },
          { lat: 37.7849, lon: -122.4094 },
        ],
        costing: CostingModel.Auto,
        units: DistanceUnit.Km,
      };

      const result = await routeOverview(params);

      expect(result).toBeDefined();
      expect(result.content[0]).toHaveProperty("type", "text");
      expect(result.content[0].text).toContain("Route calculation failed:");
    });
  });

  describe("Response formatting", () => {
    it("should format response with all required fields", async () => {
      const params: RouteOverviewParams = {
        locations: [
          { lat: 37.7749, lon: -122.4194 },
          { lat: 37.7849, lon: -122.4094 },
        ],
        costing: CostingModel.Auto,
        units: DistanceUnit.Km,
      };

      const result = await routeOverview(params);

      const text = result.content[0].text;
      expect(text).toContain("Travel distance:");
      expect(text).toContain("Travel time:");
      expect(text).toContain("BBOX");
      expect(text).toContain("Polyline");
    });
  });
});
