import { describe, it, expect } from "vitest";
import { isochrone, type IsochroneParams } from "./isochrone.js";
import { IsochroneCostingModel } from "@stadiamaps/api";
import { server } from "../test/setup.js";
import { http, HttpResponse } from "msw";
import { isochroneDistanceFixture } from "../test/fixtures/isochroneDistance.js";
import { isochroneEmptyFixture } from "../test/fixtures/isochroneEmpty.js";

describe("Isochrone Tools", () => {
  describe("isochrone", () => {
    it("should generate time-based isochrone contours", async () => {
      const params: IsochroneParams = {
        location: { lat: 37.7749, lon: -122.4194 }, // San Francisco
        costing: IsochroneCostingModel.Auto,
        contours: [{ time: 15 }, { time: 30 }],
      };

      const result = await isochrone(params);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0]).toHaveProperty("type", "text");
      expect(result.content[0].text).toContain("Isochrone Results:");
      expect(result.content[0].text).toContain("Contour 15");
      expect(result.content[0].text).toContain("Time: 15 minutes");
      expect(result.content[0].text).toContain("Contour 30");
      expect(result.content[0].text).toContain("Time: 30 minutes");
      expect(result.content[0].text).toContain("GeoJSON Geometry:");
    });

    it("should generate distance-based isochrone contours", async () => {
      // Override the default handler for this test
      server.use(
        http.post("https://api.stadiamaps.com/isochrone/v1", () => {
          return HttpResponse.json(isochroneDistanceFixture);
        }),
      );

      const params: IsochroneParams = {
        location: { lat: 37.7749, lon: -122.4194 },
        costing: IsochroneCostingModel.Pedestrian,
        contours: [{ distance: 5 }],
      };

      const result = await isochrone(params);

      expect(result).toBeDefined();
      expect(result.content[0].text).toContain("Contour 5");
      expect(result.content[0].text).toContain("Distance: 5 km");
    });

    it("should handle single contour", async () => {
      const params: IsochroneParams = {
        location: { lat: 37.7749, lon: -122.4194 },
        costing: IsochroneCostingModel.Bicycle,
        contours: [{ time: 15 }],
      };

      const result = await isochrone(params);

      expect(result).toBeDefined();
      expect(result.content[0].text).toContain("Contour 15");
      expect(result.content[0].text).toContain("Time: 15 minutes"); // From mock
    });

    it("should handle empty results", async () => {
      // Override the default handler for this test
      server.use(
        http.post("https://api.stadiamaps.com/isochrone/v1", () => {
          return HttpResponse.json(isochroneEmptyFixture);
        }),
      );

      const params: IsochroneParams = {
        location: { lat: 37.7749, lon: -122.4194 },
        costing: IsochroneCostingModel.Auto,
        contours: [{ time: 15 }],
      };

      const result = await isochrone(params);

      expect(result).toBeDefined();
      expect(result.content[0].text).toBe("No isochrone results found.");
    });

    it("should handle API errors gracefully", async () => {
      // Override the default handler for this test to return an error
      server.use(
        http.post("https://api.stadiamaps.com/isochrone/v1", () => {
          return HttpResponse.json(
            { error: "Invalid request parameters" },
            { status: 400 },
          );
        }),
      );

      const params: IsochroneParams = {
        location: { lat: 37.7749, lon: -122.4194 },
        costing: IsochroneCostingModel.Auto,
        contours: [{ time: 15 }],
      };

      const result = await isochrone(params);

      expect(result).toBeDefined();
      expect(result.content[0].text).toContain("Isochrone calculation failed:");
    });
  });
});
