import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { CostingModel, DistanceUnit } from "@stadiamaps/api";
import { Coordinates } from "./types.js";
import { timeAndZoneInfo } from "./tools/tz.js";
import {
  addressGeocode,
  coarseLookup,
  placeSearch,
} from "./tools/geocoding.js";
import { routeOverview } from "./tools/routing.js";
import {
    DEFAULT_STYLE,
    staticMapCentered,
    staticMapWithMarker,
    staticRouteMap,
} from "./tools/staticMaps.js";

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
    lat: z.number().min(-90).max(90).describe("The latitude of the point."),
    lon: z.number().min(-180).max(180).describe("The longitude of the point."),
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
    countryFilter: z
      .array(
        z
          .string()
          .length(3)
          .describe(
            "An ISO 3166-1 alpha-3 country code to limit the search to (e.g. USA, DEU, EST).",
          ),
      )
      .optional(),
    lang: z
      .string()
      .min(2)
      .describe(
        "A BCP-47 language tag (may just be the language) to localize the results in (e.g. en, de, et).",
      ),
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
    countryFilter: z
      .array(
        z
          .string()
          .length(3)
          .describe(
            "An ISO 3166-1 alpha-3 country code to limit the search to (e.g. USA, DEU, EST).",
          ),
      )
      .optional(),
    lang: z
      .string()
      .min(2)
      .describe(
        "A BCP-47 language tag (may just be the language) to localize the results in (e.g. en, de, et).",
      ),
  },
  addressGeocode,
);

server.tool(
  "place-search",
  "Search for points of interest (POIs) by name. This works best when searching for just the place name (e.g. Starbucks). Use coordinates to focus the search to a local area. For larger areas like a region, state, or country, you can append it to the name. Use the  POI data always includes geographic coordinates and may include opening hours, website, social media, and other information.",
  {
    query: z
      .string()
      .describe(
        "The name of the place to search for (e.g. restaurant, park, museum).",
      ),
    countryFilter: z
      .array(
        z
          .string()
          .length(3)
          .describe(
            "An ISO 3166-1 alpha-3 country code to limit the search to (e.g. USA, DEU, EST).",
          ),
      )
      .optional(),
    lang: z
      .string()
      .min(2)
      .describe(
        "A BCP-47 language tag (may just be the language) to localize the results in (e.g. en, de, et).",
      ),
    focusPointLat: z
      .number()
      .min(-90)
      .max(90)
      .describe("The latitude to focus the search on.")
      .optional(),
    focusPointLon: z
      .number()
      .min(-180)
      .max(180)
      .describe("The longitude to focus the search on.")
      .optional(),
  },
  placeSearch,
);

server.tool(
  "route-overview",
  "Get high-level routing information between two or more locations. Includes travel time, distance, and an encoded polyline of the route.",
  {
    locations: z
      .array(
        z
          .object({
            lat: z.number().describe("The latitude of the location"),
            lon: z.number().describe("The longitude of the location"),
          })
          .describe("A place to visit along the route"),
      )
      .min(2),
    costing: z
      .nativeEnum(CostingModel)
      .describe(
        "The method of travel to use when routing (auto = automobile).",
      ),
    units: z
      .nativeEnum(DistanceUnit)
      .describe("The unit to report distances in."),
  },
  routeOverview,
);

// TODO: Variant that REQUIRES a boundary circle to implement a new fuzzy match; i.e. 3500 Kane Hill Rd, Harborcreek, PA is not technically correct but should work

// Static Maps Tools
server.tool(
  "static-map-centered",
  "Generate a basic map centered on a location. Returns a PNG image.",
  {
    style: z
      .string()
      .describe("The map style to use (e.g., outdoors, alidade_smooth).")
      .default(DEFAULT_STYLE),
    lat: z
      .number()
      .min(-90)
      .max(90)
      .describe("The latitude of the center point."),
    lon: z
      .number()
      .min(-180)
      .max(180)
      .describe("The longitude of the center point."),
    zoom: z.number().min(0).max(20).describe("The zoom level (0-20)."),
    size: z
      .string()
      .describe(
        "The size of the image in pixels, format: 'widthxheight' (e.g., '800x600').",
      ),
  },
  staticMapCentered,
);

server.tool(
  "static-map-with-marker",
  "Generate a map with a marker at a specific location. Returns a PNG image.",
  {
    style: z
      .string()
      .describe("The map style to use (e.g., outdoors, alidade_smooth).")
      .default(DEFAULT_STYLE),
    lat: z
      .number()
      .min(-90)
      .max(90)
      .describe("The latitude of the marker location."),
    lon: z
      .number()
      .min(-180)
      .max(180)
      .describe("The longitude of the marker location."),
    zoom: z.number().min(0).max(20).describe("The zoom level (0-20)."),
    size: z
      .string()
      .describe(
        "The size of the image in pixels, format: 'widthxheight' (e.g., '800x600').",
      ),
    label: z.string().describe("Optional label for the marker.").optional(),
    color: z
      .string()
      .describe("Optional color for the marker (hex code or color name).")
      .optional(),
    markerStyle: z
      .string()
      .describe("Optional custom marker style or URL to a custom marker image.")
      .optional(),
  },
  staticMapWithMarker,
);

server.tool(
  "static-route-map",
  "Generate a map showing a route from an encoded polyline. Returns a PNG image.",
  {
    style: z
      .string()
      .describe("The map style to use (e.g., outdoors, alidade_smooth).")
      .default(DEFAULT_STYLE),
    encodedPolyline: z
      .string()
      .describe("The encoded polyline representing the route (precision 6)."),
    size: z
      .string()
      .describe(
        "The size of the image in pixels, format: widthxheight (e.g. 800x400).",
      ),
    strokeColor: z
      .string()
      .describe("Optional color for the route line (hex code or CSS color name; e.g. FFFFFF or blue).")
      .optional(),
    strokeWidth: z
      .number()
      .describe("Optional width for the route line in pixels.")
      .optional(),
    markers: z
      .array(
        z.object({
          lat: z
            .number()
            .min(-90)
            .max(90)
            .describe("The latitude of the marker."),
          lon: z
            .number()
            .min(-180)
            .max(180)
            .describe("The longitude of the marker."),
          label: z
            .string()
            .describe("Optional label for the marker (one character limit; supports most emoji).")
            .optional(),
          color: z
            .string()
            .describe("Optional color for the marker (hex code or CSS color name; e.g. FFFFFF or blue).")
            .optional(),
          markerStyle: z
            .string()
            .describe("Optional custom marker style or URL.")
            .optional(),
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
