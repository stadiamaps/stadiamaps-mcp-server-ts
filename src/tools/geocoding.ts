import {
  GeocodeResponseEnvelopePropertiesV2,
  GeocodingApi,
} from "@stadiamaps/api";
import { apiConfig } from "../config.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

const geocodeApi = new GeocodingApi(apiConfig);

export type UnstructuredGeocodeParams = {
  query: string;
  countryFilter?: Array<string>;
  lang: string;
};

export type PlaceSearchParams = UnstructuredGeocodeParams & {
  focusPointLat?: number;
  focusPointLon?: number;
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

  const res = envelope.features.map((feature) => {
    let location: string | null | undefined;
    if (feature.properties.formattedAddressLine) {
      location = feature.properties.formattedAddressLine;
    } else {
      location = feature.properties.coarseLocation;
    }

    return [
      `Name: ${feature.properties?.name}`,
      `GeoJSON Geometry: ${JSON.stringify(feature.geometry)}`,
      `Location: ${location || "unknown"}`,
      `Additional information: ${JSON.stringify(feature.properties.addendum)}`,
    ].join("\n")
  }).join("\n---\n");

  return {
    content: [
      {
        type: "text",
        text: `Results:\n---${res}`,
      },
    ],
  };
}

export async function coarseLookup({
  query,
  countryFilter,
  lang,
}: UnstructuredGeocodeParams): Promise<CallToolResult> {
  const res = await geocodeApi.searchV2({
    text: query,
    boundaryCountry: countryFilter,
    lang,
    layers: ["coarse"],
    size: 3
  });

  return geocodingToolResult(res);
}

export async function addressGeocode({
  query,
  countryFilter,
  lang,
}: UnstructuredGeocodeParams): Promise<CallToolResult> {
  const res = await geocodeApi.searchV2({
    text: query,
    boundaryCountry: countryFilter,
    lang,
    layers: ["address"],
    size: 3,
  });

  return geocodingToolResult(res);
}

export async function placeSearch({
  query,
  countryFilter,
  lang,
  focusPointLat,
  focusPointLon,
}: PlaceSearchParams): Promise<CallToolResult> {
  const res = await geocodeApi.searchV2({
    text: query,
    boundaryCountry: countryFilter,
    lang,
    layers: ["poi"],
    focusPointLat,
    focusPointLon,
    size: 3,
  });

  return geocodingToolResult(res);
}
