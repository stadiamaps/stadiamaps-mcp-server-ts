import { describe, it, expect } from "vitest";
import { timeAndZoneInfo } from "./tz.js";
import { type Coordinates } from "../types.js";
import { server } from "../test/setup.js";
import { http, HttpResponse } from "msw";

describe("Timezone Tools", () => {
  describe("timeAndZoneInfo", () => {
    it("should get timezone information for coordinates", async () => {
      const coordinates: Coordinates = {
        lat: 37.7749,
        lon: -122.4194,
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
        "Mon, 01 Jun 2024 09:00:00 -0700",
      );
    });
  });

  describe("Error handling", () => {
    it("should handle API errors gracefully", async () => {
      // Override the default handler for this test to return an error
      server.use(
        http.get("*/tz/lookup/v1*", () => {
          return HttpResponse.json(
            { error: "Invalid coordinates" },
            { status: 400 },
          );
        }),
      );

      const coordinates: Coordinates = {
        lat: 37.7749,
        lon: -122.4194,
      };

      // This should throw an error since we're mocking a 400 response
      await expect(timeAndZoneInfo(coordinates)).rejects.toThrow();
    });
  });

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
