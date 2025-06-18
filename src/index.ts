import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { timeAndZoneInfo } from "./tools/tz.js";
import {
  addressGeocode,
  bulkStructuredGeocode,
  bulkUnstructuredGeocode,
  coarseLookup,
  placeSearch,
} from "./tools/geocoding.js";
import { routeOverview } from "./tools/routing.js";
import {
  staticMapCentered,
  staticMapWithMarker,
  staticRouteMap,
} from "./tools/staticMaps.js";
import {
  latitudeSchema,
  longitudeSchema,
  coordinatesSchema,
  countryFilterSchema,
  languageSchema,
  geocodingCommonSchema,
  focusPointSchema,
  mapStyleSchema,
  mapSizeSchema,
  zoomSchema,
  markerLabelSchema,
  markerColorSchema,
  markerStyleSchema,
  costingSchema,
  unitsSchema,
} from "./schemas.js";

const server = new McpServer({
  name: "stadia-maps",
  version: "0.1.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// TODO: Set an explicit user agent? Or is that done above?

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

server.tool(
  "coarse-lookup",
  "Get information about an area such as a neighborhood, city, state, or country. Any sort of place with an area recognized either legally or colloquially. Returns location, geographic context (e.g. which state and country a city is located in), and metadata like wikipedia ID and population.",
  {
    query: z
      .string()
      .describe(
        "The name of the area (e.g. New York, Berlin, or Kesklinn). You can search for place names using any name, regardless of the lang parameter.",
      ),
    ...geocodingCommonSchema.shape,
  },
  coarseLookup,
);

server.tool(
  "address-geocode",
  "Get the coordinates and geographic context (city, state, country, etc.) for a street address (do NOT use to look up a place by name; only by address).",
  {
    query: z
      .string()
      .describe(
        "The address text. Use local formatting and order when possible.",
      ),
    ...geocodingCommonSchema.shape,
  },
  addressGeocode,
);

server.tool(
  "place-search",
  "Search for points of interest (POIs) by name and get their geographic coordinates and available info about the place. Results always include geographic coordinates and may include opening hours, website, social media, and other information.",
  {
    query: z
      .string()
      .describe(
        "The name of the place to search for (e.g. restaurant, park, museum). Use only the place name and well-known regions such as a city, state/province, or country. Local neighborhood names are less reliable as a textual filter; onsider using the focus point for these if possible.",
      ),
    ...geocodingCommonSchema.shape,
  },
  placeSearch,
);

server.tool(
  "bulk-unstructured-geocode",
  "Perform multiple unstructured geocoding operations in a single request. Returns results as a JSON list.",
  {
    items: z
      .array(
        z.object({
          query: z.string().describe("The query text for geocoding."),
          ...geocodingCommonSchema.shape,
        }),
      )
      .min(1)
      .describe("Array of unstructured geocoding items to process in bulk."),
  },
  bulkUnstructuredGeocode,
);

server.tool(
  "bulk-structured-geocode",
  "Perform multiple structured geocoding operations in a single request. Returns results as a JSON list.",
  {
    items: z
      .array(
        z.object({
          // Structured geocoding fields
          address: z
            .string()
            .describe(
              "The street address. Include the road and house/building number if possible (e.g. Telliskivi 60a/3)",
            )
            .optional(),
          locality: z.string().describe("The locality/city.").optional(),
          region: z
            .string()
            .describe(
              "The region/state/prefecture (first-level administrative subdivision for most of the world besides the UK).",
            )
            .optional(),
          postalcode: z.string().describe("The postal code.").optional(),
          country: z
            .string()
            .describe("The country or dependency (e.g. US Virgin Islands).")
            .optional(),
          // Common parameters
          ...geocodingCommonSchema.shape,
        }),
      )
      .min(1)
      .describe("Array of structured geocoding items to process in bulk."),
  },
  bulkStructuredGeocode,
);

server.tool(
  "route-overview",
  "Get high-level routing information between two or more locations. Includes travel time, distance, and an encoded polyline of the route.",
  {
    locations: z.array(coordinatesSchema).min(2),
    costing: costingSchema,
    units: unitsSchema,
  },
  routeOverview,
);

// TODO: Variant that REQUIRES a boundary circle to implement a new fuzzy match; i.e. 3500 Kane Hill Rd, Harborcreek, PA is not technically correct but should work

// Static Maps Tools
server.tool(
  "static-map-centered",
  "Generate a basic map centered on a location. Returns a PNG image.",
  {
    style: mapStyleSchema,
    lat: latitudeSchema,
    lon: longitudeSchema,
    zoom: zoomSchema,
    size: mapSizeSchema,
  },
  staticMapCentered,
);

server.tool(
  "static-map-with-marker",
  "Generate a map with a marker at a specific location. Returns a PNG image.",
  {
    style: mapStyleSchema,
    lat: latitudeSchema,
    lon: longitudeSchema,
    zoom: zoomSchema,
    size: mapSizeSchema,
    label: markerLabelSchema,
    color: markerColorSchema,
    markerStyle: markerStyleSchema,
  },
  staticMapWithMarker,
);

server.tool(
  "static-route-map",
  "Generate a map showing a route from an encoded polyline. Returns a PNG image.",
  {
    style: mapStyleSchema,
    encodedPolyline: z
      .string()
      .describe("The encoded polyline representing the route (precision 6)."),
    size: mapSizeSchema,
    strokeColor: z
      .string()
      .describe(
        "Optional color for the route line (hex code or CSS color name; e.g. FFFFFF or blue).",
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
      .describe("Optional markers to add to the map.")
      .optional(),
  },
  staticRouteMap,
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
