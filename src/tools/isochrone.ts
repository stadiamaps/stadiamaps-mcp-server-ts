import {
  RoutingApi,
  IsochroneRequest,
  IsochroneResponse,
  IsochroneCostingModel,
  Contour,
  instanceOfIsochroneResponse,
} from "@stadiamaps/api";
import { apiConfig } from "../config.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { Coordinates } from "../types.js";
import { handleToolError } from "../errorHandler.js";

const routeApi = new RoutingApi(apiConfig);

export type IsochroneParams = {
  location: Coordinates;
  costing: IsochroneCostingModel;
  contours: Contour[];
};

function isochroneToolResult(response: IsochroneResponse): CallToolResult {
  if (!response.features || !response.features.length) {
    return {
      content: [
        {
          type: "text",
          text: "No isochrone results found.",
        },
      ],
    };
  }

  const results = response.features
    .map((feature, index) => {
      const properties = feature.properties;
      if (!properties) return `Invalid result (no properties): ${index}`;

      const contourInfo = `Contour ${properties.contour}`;

      let metricInfo = "";
      if (properties?.metric === "time") {
        metricInfo = `Time: ${properties.contour} minutes`;
      } else if (properties?.metric === "distance") {
        metricInfo = `Distance: ${properties.contour} km`;
      }

      return [
        `${contourInfo}`,
        metricInfo ? `${metricInfo}` : "",
        `GeoJSON Geometry: ${JSON.stringify(feature.geometry)}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n---\n");

  return {
    content: [
      {
        type: "text",
        text: `Isochrone Results:\n---\n${results}`,
      },
    ],
  };
}

export async function isochrone({
  location,
  costing,
  contours,
}: IsochroneParams): Promise<CallToolResult> {
  return handleToolError(
    async () => {
      const request: IsochroneRequest = {
        locations: [location],
        costing,
        contours,
      };

      const response = await routeApi.isochrone({ isochroneRequest: request });

      if (instanceOfIsochroneResponse(response)) {
        return isochroneToolResult(response);
      } else {
        return {
          content: [
            {
              type: "text",
              text: "Unexpected response format from isochrone API.",
            },
          ],
        };
      }
    },
    {
      contextMessage: "Isochrone calculation failed",
      enableLogging: true,
    },
  );
}
