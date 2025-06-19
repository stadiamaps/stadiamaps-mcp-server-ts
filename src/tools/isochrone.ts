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

const routeApi = new RoutingApi(apiConfig);

export type IsochroneParams = {
  location: Coordinates;
  costing: IsochroneCostingModel;
  contours: Contour[];
};

function isochroneToolResult(
  response: IsochroneResponse,
): CallToolResult {
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
      const contourInfo = properties?.contour !== undefined
        ? `Contour ${properties.contour}`
        : `Feature ${index + 1}`;

      let metricInfo = '';
      if (properties?.metric === 'time' && properties?.contour !== undefined) {
        metricInfo = `Time: ${properties.contour} minutes`;
      } else if (properties?.metric === 'distance' && properties?.contour !== undefined) {
        metricInfo = `Distance: ${properties.contour} km`;
      }

      return [
        `${contourInfo}`,
        metricInfo ? `${metricInfo}` : '',
        `GeoJSON Geometry: ${JSON.stringify(feature.geometry)}`,
      ].filter(Boolean).join('\n');
    })
    .join('\n---\n');

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
  try {
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
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Isochrone calculation failed: ${JSON.stringify(error)}`,
        },
      ],
    };
  }
}
