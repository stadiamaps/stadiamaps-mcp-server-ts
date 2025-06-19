import { describe, it, expect, beforeEach } from "vitest";
import {
  staticMapCentered,
  staticMapWithMarker,
  staticRouteMap,
  type StaticMapCenteredParams,
  type StaticMapWithMarkerParams,
  type StaticRouteMapParams,
} from "./staticMaps.js";
import { server } from "../test/setup.js";
import { http, HttpResponse } from "msw";
import { staticMapFixture } from "../test/fixtures/staticMap.js";

describe("Static Maps Tools", () => {
  describe("staticMapCentered", () => {
    it("should generate a centered static map", async () => {
      const params: StaticMapCenteredParams = {
        lat: 37.7749,
        lon: -122.4194,
        zoom: 12,
        size: "400x400",
      };

      const result = await staticMapCentered(params);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0]).toHaveProperty("type", "image");
      expect(result.content[0]).toHaveProperty("data");
      expect(result.content[0]).toHaveProperty("mimeType", "image/png");
    });
  });

  describe("staticMapWithMarker", () => {
    it("should generate a static map with a marker", async () => {
      const params: StaticMapWithMarkerParams = {
        lat: 37.7749,
        lon: -122.4194,
        zoom: 12,
        size: "400x400",
        label: "A",
        color: "red",
      };

      const result = await staticMapWithMarker(params);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0]).toHaveProperty("type", "image");
      expect(result.content[0]).toHaveProperty("data");
      expect(result.content[0]).toHaveProperty("mimeType", "image/png");
    });
  });

  describe("staticRouteMap", () => {
    it("should generate a static map with a route", async () => {
      const params: StaticRouteMapParams = {
        encodedPolyline: "u{~vFvyys@fS]",
        size: "400x400",
        strokeColor: "blue",
        strokeWidth: 5,
      };

      const result = await staticRouteMap(params);

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

      const params: StaticMapCenteredParams = {
        lat: 37.7749,
        lon: -122.4194,
        zoom: 12,
        size: "400x400",
      };

      const result = await staticMapCentered(params);

      expect(result).toBeDefined();
      expect(result.content[0]).toHaveProperty("type", "text");
      expect(result.content[0].text).toContain(
        "Failed to generate static map:",
      );
    });
  });
});
