import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { timeAndZoneInfo } from "./tools/tz.js";
import { geocode, bulkGeocode } from "./tools/geocoding.js";
import { routeOverview } from "./tools/routing.js";
import { isochrone } from "./tools/isochrone.js";
import { staticMap } from "./tools/staticMaps.js";
import {
  latitudeSchema,
  longitudeSchema,
  coordinatesSchema,
  geocodingCommonSchema,
  mapStyleSchema,
  markerLabelSchema,
  markerColorSchema,
  markerStyleSchema,
  costingSchema,
  unitsSchema,
  isochroneCostingSchema,
  contoursSchema,
  geocodingUnstructuredQuery,
} from "./schemas.js";

const server = new McpServer({
  name: "stadia-maps",
  version: "0.1.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Tool setup

server.tool(
  "time-and-zone-info",
  "Get the current time and zone info at any point (geographic coordinates). Output includes includes the standard UTC offset, special offset currently in effect (typically but not always Daylight Saving Time), IANA TZID, and the current timestamp in RFC 28222 format.",
  {
    lat: latitudeSchema,
    lon: longitudeSchema,
  },
  timeAndZoneInfo,
);

const commonGeocodingDescription =
  "Returned geographic information includes coordinates, bounding box, local context (what country, city, etc. is it in).";

server.tool(
  "geocode",
  `Look up a street address, POI, or area. ${commonGeocodingDescription}. Additional info may include Wikipedia ID, population, opening hours, website, and more, subject to availability.`,
  {
    query: geocodingUnstructuredQuery,
    ...geocodingCommonSchema.shape,
  },
  geocode,
);

// This tool uses our bulk geocoding API (available to Standard plans and higher).
// It is the *unstructured* variant that assumes full text input.
// You can modify this tool if you're looking for structured geocoding instead.
server.tool(
  "bulk-geocode",
  `Perform multiple address geocoding operations in a single request. Returns results as a JSON list, showing only the first result for each. Using this to geocode POIs is strongly discouraged, as many places with the same name exist; only use this for addresses. ${commonGeocodingDescription}`,
  {
    items: z
      .array(
        z.object({
          query: geocodingUnstructuredQuery,
          ...geocodingCommonSchema.shape,
        }),
      )
      .min(1)
      .describe("Array of geocoding items to process in bulk."),
  },
  bulkGeocode,
);

server.tool(
  "route-overview",
  "Get high-level routing information between two or more locations. Includes travel time, distance, and an encoded polyline of the route. The result is JSON. Be careful with polyline output as the JSON string may contain escaped backslashes!",
  {
    locations: z.array(coordinatesSchema).min(2),
    costing: costingSchema,
    units: unitsSchema,
  },
  routeOverview,
);

server.tool(
  "isochrone",
  "Generate isochrone contours showing areas reachable within specified time or distance constraints from a single location. Returns GeoJSON polygons representing the reachable areas.",
  {
    location: coordinatesSchema,
    costing: isochroneCostingSchema,
    contours: contoursSchema,
  },
  isochrone,
);

// Static Maps; this tool is capable of a lot. If your needs are simpler, you can focus it.
server.tool(
  "static-map",
  "Generate a PNG map image of an area, optionally including markers and a line (e.g. to draw a route or a boundary)",
  {
    style: mapStyleSchema,
    encodedPolyline: z
      .string()
      .describe(
        "The encoded polyline representing the route (precision 6). Optional, but either markers or a polyline must be specified. Be careful not to double escape this.",
      )
      .optional(),
    strokeColor: z
      .string()
      .describe(
        "Optional color for the polyline (hex code or CSS color name; e.g. FFFFFF or blue).",
      )
      .optional(),
    strokeWidth: z
      .number()
      .describe("Optional width for the route line in pixels.")
      .optional(),
    markers: z
      .array(
        z.object({
          lat: latitudeSchema,
          lon: longitudeSchema,
          label: markerLabelSchema,
          color: markerColorSchema,
          markerStyle: markerStyleSchema,
        }),
      )
      .describe(
        "Markers to add to the map. Optional, but either markers or a polyline must be specified.",
      )
      .optional(),
  },
  staticMap,
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // NOTE: This is NOT a mistake; other levels will be interpreted as MCP outputs!
  console.error("Stadia Maps MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
