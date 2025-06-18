import { describe, it, expect, vi } from "vitest";
import { routeOverview, type RouteOverviewParams } from "./routing.js";
import { CostingModel, DistanceUnit } from "@stadiamaps/api";

// Mock the Stadia Maps API
vi.mock("@stadiamaps/api", () => ({
  RoutingApi: vi.fn().mockImplementation(() => ({
    route: vi.fn().mockResolvedValue({
      trip: {
        locations: [
          {
            type: "break",
            lat: 60.534715,
            lon: -149.543469,
            original_index: 0,
          },
          {
            type: "break",
            lat: 60.53499,
            lon: -149.54858,
            original_index: 1,
          },
        ],
        legs: [
          {
            summary: {
              has_time_restrictions: false,
              has_toll: false,
              has_highway: false,
              has_ferry: false,
              minLat: 60.534715,
              minLon: -149.54858,
              maxLat: 60.535008,
              maxLon: -149.543469,
              time: 11.487,
              length: 0.176,
              cost: 56.002,
            },
            shape: "wzvmrBxalf|GcCrX}A|Nu@jI}@pMkBtZ{@x^_Afj@Inn@`@veB",
          },
        ],
        summary: {
          has_time_restrictions: false,
          has_toll: false,
          has_highway: false,
          has_ferry: false,
          minLat: 60.534715,
          minLon: -149.54858,
          maxLat: 60.535008,
          maxLon: -149.543469,
          time: 11.487,
          length: 0.176,
          cost: 56.002,
        },
        status_message: "Found route between points",
        status: 0,
        units: "miles",
        language: "en-US",
      },
    }),
  })),
  CostingModel: {
    Auto: "auto",
    Pedestrian: "pedestrian",
    Bicycle: "bicycle",
    Taxi: "taxi",
  },
  DistanceUnit: {
    Km: "km",
    Mi: "mi",
  },
  instanceOfRouteResponse: vi.fn().mockReturnValue(true),
}));

// Mock the config to avoid needing real API keys in tests
vi.mock("../config.js", () => ({
  apiConfig: {
    apiKey: "test-api-key",
  },
}));

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

  // TODO: Error handling test

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
      expect(text).toMatch(/Travel distance: [\d.]+ km/);
      expect(text).toMatch(/Travel time: .*/);
      expect(text).toMatch(/BBOX \(W,S,N,E\): \[.*\]/);
      expect(text).toMatch(/Polyline \(6 digits of precision\): .*/);
    });
  });
});
