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
import { handleToolError } from "../errorHandler.js";

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
  const req: RouteRequest = {
    locations,
    directionsType: "none",
    units,
    costing,
  };

  return handleToolError(
    async () => {
      const res = await routeApi.route({ routeRequest: req });

      if (instanceOfRouteResponse(res)) {
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

        const route = {
          distance: `${summary.length} ${units}`,
          time: travelTime,
          bbox_w_s_n_e: [
            summary.minLon,
            summary.minLat,
            summary.maxLon,
            summary.maxLat,
          ],
          polyline6: trip.legs[0].shape,
        };

        return {
          structuredContent: route,
          content: [
            {
              type: "text",
              text: JSON.stringify(route),
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
    },
    {
      contextMessage: "Route calculation failed",
      enableLogging: true,
    },
  );
}
