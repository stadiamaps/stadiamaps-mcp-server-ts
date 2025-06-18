import { describe, it, expect, vi } from "vitest";
import { timeAndZoneInfo } from "./tz.js";
import { type Coordinates } from "../types.js";

// Mock the Stadia Maps API
vi.mock("@stadiamaps/api", () => ({
  GeospatialApi: vi.fn().mockImplementation(() => ({
    tzLookup: vi.fn().mockResolvedValue({
      tzId: "America/Los_Angeles",
      baseUtcOffset: -28800,
      dstOffset: 3600,
      localRfc2822Timestamp: "Mon, 01 Jun 2024 12:00:00 -0700",
    }),
  })),
}));

// Mock the config to avoid needing real API keys in tests
vi.mock("../config.js", () => ({
  apiConfig: {
    apiKey: "test-api-key",
  },
}));

describe("Timezone Tools", () => {
  describe("timeAndZoneInfo", () => {
    it("should get timezone information for coordinates", async () => {
      const coordinates: Coordinates = {
        lat: 37.7749,
        lon: -122.4194, // San Francisco
      };

      const result = await timeAndZoneInfo(coordinates);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0]).toHaveProperty("type", "text");
      expect(result.content[0].text).toContain("TZID:");
      expect(result.content[0].text).toContain("Standard UTC offset:");
      expect(result.content[0].text).toContain("Special offset (e.g. DST):");
      expect(result.content[0].text).toContain("Current time (RFC 2822):");
    });

    it("should format UTC offset correctly", async () => {
      const coordinates: Coordinates = {
        lat: 37.7749,
        lon: -122.4194,
      };

      const result = await timeAndZoneInfo(coordinates);

      // Mock returns -28800 seconds (-8 hours)
      expect(result.content[0].text).toContain("Standard UTC offset: -28800");
    });

    it("should format DST offset correctly", async () => {
      const coordinates: Coordinates = {
        lat: 37.7749,
        lon: -122.4194,
      };

      const result = await timeAndZoneInfo(coordinates);

      // Mock returns 3600 seconds (+1 hour for DST)
      expect(result.content[0].text).toContain(
        "Special offset (e.g. DST): 3600",
      );
    });

    it("should include RFC 2822 timestamp", async () => {
      const coordinates: Coordinates = {
        lat: 37.7749,
        lon: -122.4194,
      };

      const result = await timeAndZoneInfo(coordinates);

      expect(result.content[0].text).toMatch(/Current time \(RFC 2822\): .*/);
      expect(result.content[0].text).toContain(
        "Mon, 01 Jun 2024 12:00:00 -0700",
      );
    });
  });

  // TODO: Error handling test

  describe("Response formatting", () => {
    it("should format response with all required fields", async () => {
      const coordinates: Coordinates = {
        lat: 37.7749,
        lon: -122.4194,
      };

      const result = await timeAndZoneInfo(coordinates);

      const text = result.content[0].text;
      expect(text).toMatch(/TZID: .*/);
      expect(text).toMatch(/Standard UTC offset: -?\d+/);
      expect(text).toMatch(/Special offset \(e\.g\. DST\): -?\d+/);
      expect(text).toMatch(/Current time \(RFC 2822\): .*/);
    });
  });
});
