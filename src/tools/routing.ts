import {
  RoutingApi,
  CostingModel,
  DistanceUnit,
  instanceOfRouteResponse,
  RouteRequest,
} from "@stadiamaps/api";
import { apiConfig } from "../config.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { Coordinates } from "../types.js";

const routeApi = new RoutingApi(apiConfig);

export type RouteOverviewParams = {
  locations: Coordinates[];
  costing: CostingModel;
  units: DistanceUnit;
};

export async function routeOverview({
  locations,
  costing,
  units,
}: RouteOverviewParams): Promise<CallToolResult> {
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
            text: [
              `Travel distance: ${summary.length} ${units}`,
              `Travel time: ${travelTime}`,
              `BBOX (W,S,N,E): [${summary.minLon}, ${summary.minLat}, ${summary.maxLon}, ${summary.maxLat}]`,
              `Polyline (6 digits of precision): ${trip.legs[0].shape}`,
            ].join("\n"),
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
}
