import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  RoutingApi,
  CostingModel,
  DistanceUnit,
  instanceOfRouteResponse,
  RouteRequest,
} from "@stadiamaps/api";
import { apiConfig } from "./config.js";
import { timeAndZoneInfo } from "./tools/tz.js";
import {
  addressGeocode,
  coarseLookup,
  placeSearch,
} from "./tools/geocoding.js";

const routeApi = new RoutingApi(apiConfig);

const server = new McpServer({
  name: "stadia-maps",
  version: "0.1.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// TODO: Set an explicit user agent? Or is that done above?

export type Coordinates = { lat: number; lon: number };

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
    // Params
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
  // Echoes params
  async ({ locations, costing, units }) => {
    console.error("Generate route request...");
    const req: RouteRequest = {
      locations,
      // directionsType: 'none',
      units,
      costing,
    };
    console.error("req", req);

    try {
      const res = await routeApi.route({ routeRequest: req });

      if (instanceOfRouteResponse(res)) {
        console.error("res", res);

        if (res.trip.status != 0) {
          return {
            content: [
              {
                type: "text",
                text: "No routes found.",
              },
            ],
          };
        }

        const trip = res.trip;
        const summary = trip.summary;
        let travelTime: string;
        if (summary.time < 60) {
          travelTime = "less than a minute";
        } else {
          const minutes = Math.round(summary.time / 60);
          travelTime = `${minutes} minutes`;
        }

        return {
          content: [
            {
              type: "text",
              text: `Travel distance: ${summary.length} ${units}
                    Travel time: ${travelTime}
                    BBOX (W, S, N, E): [${summary.minLon}, ${summary.minLat}, ${summary.maxLon}, ${summary.maxLat}]
                    Polyline (6 digits of precision): ${trip.legs[0].shape}`,
            },
          ],
        };
      } else {
        console.error("Unexpected response:", res);

        return {
          content: [
            {
              type: "text",
              text: "Unexpected response format.",
            },
          ],
        };
      }
    } catch (error) {
      console.error("Caught error:", error);
      return {
        content: [
          {
            type: "text",
            text: `Route calculation failed: ${JSON.stringify(error)}`,
          },
        ],
      };
    }
  },
);

// TODO: Variant that REQUIRES a boundary circle to implement a new fuzzy match; i.e. 3500 Kane Hill Rd, Harborcreek, PA is not technically correct but should work

// TODO: (Cacheable?) static map!

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
