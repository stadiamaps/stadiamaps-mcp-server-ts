import { describe, it, expect } from "vitest";
import {
  coarseLookup,
  addressGeocode,
  placeSearch,
  bulkUnstructuredGeocode,
  bulkStructuredGeocode,
  type UnstructuredGeocodeParams,
  type PlaceSearchParams,
  type BulkUnstructuredGeocodeParams,
  type BulkStructuredGeocodeParams,
} from "./geocoding.js";
import { server } from "../test/setup.js";
import { http, HttpResponse } from "msw";
import { geocodingEmptyFixture } from "../test/fixtures/geocodingEmpty.js";

describe("Geocoding Tools", () => {
  describe("coarseLookup", () => {
    it("should perform a coarse geocoding lookup", async () => {
      const params: UnstructuredGeocodeParams = {
        query: "Telliskivi 60a/3",
        countryFilter: ["EE"],
        lang: "en",
      };

      const result = await coarseLookup(params);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0]).toHaveProperty("type", "text");
      expect(result.content[0].text).toContain("Results:");
      expect(result.content[0].text).toContain("Telliskivi 60a/3");
    });
  });

  describe("addressGeocode", () => {
    it("can geocode addresses", async () => {
      const params: UnstructuredGeocodeParams = {
        query: "123 Main Street, San Francisco, CA",
        lang: "en",
      };

      const result = await addressGeocode(params);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0]).toHaveProperty("type", "text");
      expect(result.content[0].text).toContain("Results:");
      expect(result.content[0].text).toContain("Telliskivi 60a/3");
    });
  });

  describe("placeSearch", () => {
    it("can look up places by name", async () => {
      const params: PlaceSearchParams = {
        query: "coffee shop",
        countryFilter: ["EE"],
        lang: "en",
        focusPoint: { lat: 37.7749, lon: -122.4194 },
      };

      const result = await placeSearch(params);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0]).toHaveProperty("type", "text");
      expect(result.content[0].text).toContain("Results:");
      expect(result.content[0].text).toContain("Telliskivi 60a/3");
    });
  });

  describe("bulkUnstructuredGeocode", () => {
    it("should perform bulk unstructured geocoding", async () => {
      const params: BulkUnstructuredGeocodeParams = {
        items: [
          {
            query: "Telliskivi 60a/3, Tallinn",
            lang: "en",
          },
          {
            query: "101 N Main St, Greenville SC",
            lang: "en",
          },
        ],
      };

      const result = await bulkUnstructuredGeocode(params);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0]).toHaveProperty("type", "text");
      expect(result.content[0].text).toContain("results");
      expect(result.content[0].text).toContain("metadata");
    });

    it("should handle empty items array", async () => {
      const params: BulkUnstructuredGeocodeParams = {
        items: [],
      };

      const result = await bulkUnstructuredGeocode(params);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
    });
  });

  describe("bulkStructuredGeocode", () => {
    it("should perform bulk structured geocoding", async () => {
      const params: BulkStructuredGeocodeParams = {
        items: [
          {
            address: "123 Main Street",
            locality: "San Francisco",
            region: "CA",
            country: "US",
            lang: "en",
          },
          {
            address: "456 Broadway",
            locality: "New York",
            region: "NY",
            country: "US",
            lang: "en",
          },
        ],
      };

      const result = await bulkStructuredGeocode(params);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0]).toHaveProperty("type", "text");
      expect(result.content[0].text).toContain("results");
      expect(result.content[0].text).toContain("metadata");
    });
  });

  describe("Empty and Error Response Handling", () => {
    it("should handle empty geocoding results", async () => {
      // Override the default handler for this test
      server.use(
        http.get("*/v2/search*", () => {
          return HttpResponse.json(geocodingEmptyFixture);
        }),
      );

      const params: UnstructuredGeocodeParams = {
        query: "nonexistent location",
        lang: "en",
      };

      const result = await coarseLookup(params);

      expect(result).toBeDefined();
      expect(result.content[0].text).toBe("No results found.");
    });

    it("should handle geocoding API errors gracefully", async () => {
      // Override the default handler for this test to return an error
      server.use(
        http.get("*/v2/search*", () => {
          return HttpResponse.json(
            { error: "Invalid request parameters" },
            { status: 400 },
          );
        }),
      );

      const params: UnstructuredGeocodeParams = {
        query: "test query",
        lang: "en",
      };

      const result = await addressGeocode(params);

      expect(result).toBeDefined();
      expect(result.content[0].text).toContain("Geocoding failed:");
    });

    it("should handle empty results for place search", async () => {
      // Override the default handler for this test
      server.use(
        http.get("*/v2/search*", () => {
          return HttpResponse.json(geocodingEmptyFixture);
        }),
      );

      const params: PlaceSearchParams = {
        query: "nonexistent place",
        lang: "en",
        focusPoint: { lat: 37.7749, lon: -122.4194 },
      };

      const result = await placeSearch(params);

      expect(result).toBeDefined();
      expect(result.content[0].text).toBe("No results found.");
    });
  });

  describe("Response formatting", () => {
    it("should format geocoding results correctly", async () => {
      const params: UnstructuredGeocodeParams = {
        query: "San Francisco",
        lang: "en",
      };

      const result = await coarseLookup(params);

      expect(result.content[0].text).toMatch(/Name:.*/);
      expect(result.content[0].text).toMatch(/GeoJSON Geometry:.*/);
      expect(result.content[0].text).toMatch(/Location:.*/);
      expect(result.content[0].text).toMatch(/Additional information:.*/);
    });

    it("should handle results with different property combinations", async () => {
      const params: UnstructuredGeocodeParams = {
        query: "Test Location",
        lang: "en",
      };

      const result = await addressGeocode(params);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0].text).toContain("Telliskivi 60a/3");
    });
  });
});
