import {
  BulkRequest,
  BulkRequestEndpointEnum,
  BulkSearchResponse,
  GeocodeResponseEnvelopePropertiesV2,
  GeocodingApi,
  LayerId,
} from "@stadiamaps/api";
import { apiConfig } from "../config.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { GeocodingCommonParams } from "../types.js";
import { handleToolError } from "../errorHandler.js";

const geocodeApi = new GeocodingApi(apiConfig);

export type UnstructuredGeocodeParams = GeocodingCommonParams & {
  query: string;
};

function geocodingToolResult(
  envelope: GeocodeResponseEnvelopePropertiesV2,
): CallToolResult {
  if (!envelope.features || !envelope.features.length) {
    return {
      content: [
        {
          type: "text",
          text: "No results found.",
        },
      ],
    };
  }

  const res = envelope.features
    .map((feature) => {
      let location: string | null | undefined;
      if (feature.properties.formattedAddressLine) {
        location = feature.properties.formattedAddressLine;
      } else {
        location = feature.properties.coarseLocation;
      }

      // Format bounding box if available (GeoJSON bbox is [west, south, east, north])
      const bboxInfo = feature.bbox
        ? `[${feature.bbox[0]}, ${feature.bbox[1]}, ${feature.bbox[2]}, ${feature.bbox[3]}]`
        : "N/A (point geometry)";

      return [
        `Name: ${feature.properties?.name}`,
        `Layer: ${feature.properties?.layer}`,
        `GeoJSON Geometry: ${JSON.stringify(feature.geometry)}`,
        `Location: ${location || "unknown"}`,
        `Bounding Box (W, S, E, N): ${bboxInfo}`,
        `Additional information: ${JSON.stringify(feature.properties.addendum)}`,
      ].join("\n");
    })
    .join("\n---\n");

  return {
    content: [
      {
        type: "text",
        text: `Results:\n---\n${res}`,
      },
    ],
  };
}

export async function geocode({
  query,
  countryFilter,
  lang,
  layer,
}: UnstructuredGeocodeParams): Promise<CallToolResult> {
  return handleToolError(
    async () => {
      const res = await geocodeApi.searchV2({
        text: query,
        boundaryCountry: countryFilter,
        lang,
        layers: layer ? [layer as LayerId] : undefined,
      });

      return geocodingToolResult(res);
    },
    {
      contextMessage: "Geocoding failed",
      enableLogging: true,
    },
  );
}

export type BulkUnstructuredGeocodeItem = GeocodingCommonParams & {
  query: string;
};

export type BulkUnstructuredGeocodeParams = {
  items: Array<BulkUnstructuredGeocodeItem>;
};

// Not used, but provided in case your application uses structured geocoding.
export type BulkStructuredGeocodeItem = GeocodingCommonParams & {
  // Structured geocoding fields
  address?: string;
  locality?: string;
  region?: string;
  postalcode?: string;
  country?: string;
};

export type BulkStructuredGeocodeParams = {
  items: Array<BulkStructuredGeocodeItem>;
};

type BulkGeocodeItemType =
  | BulkUnstructuredGeocodeItem
  | BulkStructuredGeocodeItem;

function bulkGeocodingToolResult(
  responses: Array<BulkSearchResponse>,
  invalidItems: Array<{ item: BulkGeocodeItemType; error: string }> = [],
): CallToolResult {
  // Filter out any failed requests and extract the features
  const successfulResults = responses
    .filter(
      (response) =>
        response.status === 200 &&
        response.response?.features &&
        response.response.features.length > 0,
    )
    .flatMap((response) => {
      if (!response.response) return [];

      return response.response.features
        .map((feature) => {
          return {
            label: feature.properties?.label,
            geometry: feature.geometry,
            matchType: feature.properties?.matchType,
            addendum: feature.properties?.addendum,
            bbox: feature.bbox,
          };
          // Slice to keep only the first element in the array;
          // we request a few more to enable dedupe, but only keep the first one.
        })
        .slice(0, 1);
    });

  // Get failed responses
  const failedResponses = responses
    .filter(
      (response) =>
        response.status !== 200 || !response.response?.features?.length,
    )
    .map((response) => ({
      status: response.status,
      message: response.msg || "No results found",
    }));

  // Combine all results
  const result = {
    results: successfulResults,
    metadata: {
      totalRequests: responses.length + invalidItems.length,
      successfulRequests: successfulResults.length,
      failedRequests: failedResponses.length,
      invalidItems:
        invalidItems.length > 0
          ? invalidItems.map((i) => ({
              item: i.item,
              error: i.error,
            }))
          : undefined,
    },
  };

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result),
      },
    ],
  };
}

export async function bulkGeocode({
  items,
}: BulkUnstructuredGeocodeParams): Promise<CallToolResult> {
  if (!items || items.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: "No geocoding items provided.",
        },
      ],
    };
  }

  // All items are valid by type definition (query is required)
  const bulkRequests = items.map((item) => {
    const request: BulkRequest = {
      endpoint: BulkRequestEndpointEnum.V1Search,
    };

    // Unstructured query
    request.query = {
      text: item.query,
      focusPointLat: item.focusPoint?.lat,
      focusPointLon: item.focusPoint?.lon,
      boundaryCountry: item.countryFilter,
      lang: item.lang,
    };

    return request;
  });

  return handleToolError(
    async () => {
      const responses = await geocodeApi.searchBulk({
        bulkRequest: bulkRequests,
      });
      return bulkGeocodingToolResult(responses, []);
    },
    {
      contextMessage: "Error performing bulk unstructured geocoding",
      enableLogging: true,
    },
  );
}

export async function bulkStructuredGeocode({
  items,
}: BulkStructuredGeocodeParams): Promise<CallToolResult> {
  if (!items || items.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: "No geocoding items provided.",
        },
      ],
    };
  }

  // Filter and validate items
  const validItems: Array<BulkStructuredGeocodeItem> = [];
  const invalidItems: Array<{
    item: BulkStructuredGeocodeItem;
    error: string;
  }> = [];

  items.forEach((item) => {
    // Validate that we have at least one structured field
    if (
      !item.address &&
      !item.locality &&
      !item.region &&
      !item.postalcode &&
      !item.country
    ) {
      invalidItems.push({
        item,
        error:
          "At least one structured field is required for structured geocoding",
      });
      return;
    }

    validItems.push(item);
  });

  // If all items are invalid, return an error
  if (validItems.length === 0) {
    return {
      content: [
        {
          type: "text",
          text:
            "All geocoding items are invalid: " +
            invalidItems
              .map((i) => `${JSON.stringify(i.item)}: ${i.error}`)
              .join(", "),
        },
      ],
    };
  }

  const bulkRequests = validItems.map((item) => {
    const request: BulkRequest = {
      endpoint: BulkRequestEndpointEnum.V1SearchStructured,
    };

    // Structured query
    request.query = {
      address: item.address,
      locality: item.locality,
      region: item.region,
      postalcode: item.postalcode,
      country: item.country,
      focusPointLat: item.focusPoint?.lat,
      focusPointLon: item.focusPoint?.lon,
      boundaryCountry: item.countryFilter,
      lang: item.lang,
    };

    return request;
  });

  return handleToolError(
    async () => {
      const responses = await geocodeApi.searchBulk({
        bulkRequest: bulkRequests,
      });
      return bulkGeocodingToolResult(responses, invalidItems);
    },
    {
      contextMessage: "Error performing bulk structured geocoding",
      enableLogging: true,
    },
  );
}
