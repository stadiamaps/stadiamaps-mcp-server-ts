import {API_KEY} from "../config.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

// Default map style
export const DEFAULT_STYLE = "outdoors";

// Base URL for the Static Maps API
const STATIC_MAPS_BASE_URL = "https://tiles.stadiamaps.com/static_cacheable";

/**
 * Parameters for generating a centered static map
 */
export type StaticMapCenteredParams = {
  style?: string;
  lat: number;
  lon: number;
  zoom: number;
  size: string;
};

/**
 * Parameters for generating a static map with a marker
 */
export type StaticMapWithMarkerParams = {
  style?: string;
  lat: number;
  lon: number;
  zoom: number;
  size: string;
  label?: string;
  color?: string;
  markerUrl?: string;
};

/**
 * Parameters for generating a static route map
 */
export type StaticRouteMapParams = {
  style?: string;
  encodedPolyline: string;
  size: string;
  strokeColor?: string;
  strokeWidth?: number;
  markers?: Array<{
    lat: number;
    lon: number;
    label?: string;
    color?: string;
    markerUrl?: string;
  }>;
};

/**
 * Helper function to generate a static map image and return it as a base64 encoded string
 */
async function generateStaticMap(payload: any, style: string): Promise<CallToolResult> {
  try {
    if (!API_KEY) {
      throw new Error("API key is not configured");
    }

    const url = `${STATIC_MAPS_BASE_URL}/${style}?api_key=${API_KEY}`;
    payload.size = `${payload.size}@2x`;

    const response = await fetch(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP code: ${response.status}.\nPayload: ${JSON.stringify(payload)}`);
    }

    // Get the image as a buffer
    const imageBuffer = await response.arrayBuffer();

    // Convert to base64
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    return {
      content: [
        {
          type: "image",
          data: base64Image,
          mimeType: "image/png"
        },
      ],
    };
  } catch (error) {
    console.error("Static map generation error:", error);
    return {
      content: [
        {
          type: "text",
          text: `Failed to generate static map: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}

/**
 * Generate a basic map centered on a location
 */
export async function staticMapCentered({
  style = DEFAULT_STYLE,
  lat,
  lon,
  zoom,
  size,
}: StaticMapCenteredParams): Promise<CallToolResult> {
  const payload = {
    center: {
      latitude: lat,
      longitude: lon,
    },
    zoom,
    size,
  };

  return generateStaticMap(payload, style);
}

/**
 * Generate a map with a single marker
 */
export async function staticMapWithMarker({
  style = DEFAULT_STYLE,
  lat,
  lon,
  zoom,
  size,
  label,
  color,
  markerUrl,
}: StaticMapWithMarkerParams): Promise<CallToolResult> {
  // Create marker object
  const marker: any = {
    lat,
    lon,
  };

  // Add optional marker properties if provided
  if (label) marker.label = label;
  if (color) marker.color = color;
  if (markerUrl) marker.style = `custom:${markerUrl}`;

  const payload = {
    center: {
      latitude: lat,
      longitude: lon,
    },
    zoom,
    size,
    markers: [marker],
  };

  return generateStaticMap(payload, style);
}

/**
 * Generate a map showing a route
 */
export async function staticRouteMap({
  style = DEFAULT_STYLE,
  encodedPolyline,
  size,
  strokeColor,
  strokeWidth,
  markers,
}: StaticRouteMapParams): Promise<CallToolResult> {
  // Create the line object
  const line: any = {
    shape: encodedPolyline,
  };

  // Add optional line properties if provided
  if (strokeColor) line.stroke_color = strokeColor;
  if (strokeWidth) line.stroke_width = strokeWidth;

  const payload: any = {
    size,
    lines: [line],
  };

  // Add markers if provided
  if (markers && markers.length > 0) {
    payload.markers = markers.map((marker) => {
      const markerObj: any = {
        lat: marker.lat,
        lon: marker.lon,
      };

      if (marker.label) markerObj.label = marker.label;
      if (marker.color) markerObj.color = marker.color;
      if (marker.markerUrl) markerObj.style = `custom:${marker.markerUrl}`;

      return markerObj;
    });
  }

  return generateStaticMap(payload, style);
}
