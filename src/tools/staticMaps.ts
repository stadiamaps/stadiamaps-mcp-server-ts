import { API_KEY } from "../config.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { handleToolError } from "../errorHandler.js";

// Default map style
export const DEFAULT_STYLE = "outdoors";

// Base URL for the Static Maps API
const STATIC_MAPS_BASE_URL = "https://tiles.stadiamaps.com/static_cacheable";

/**
 * Parameters for generating a static route map
 */
export type StaticMapParams = {
  style?: string;
  encodedPolyline?: string;
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
async function generateStaticMapAsCallToolResult(
  payload: any,
  style: string,
): Promise<CallToolResult> {
  return handleToolError(
    async () => {
      const url = `${STATIC_MAPS_BASE_URL}/${style}?api_key=${API_KEY}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `HTTP code: ${response.status}.\nPayload: ${JSON.stringify(payload)}`,
        );
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
            mimeType: "image/png",
          },
        ],
      };
    },
    {
      contextMessage: "Failed to generate static map",
      enableLogging: true,
    },
  );
}

/**
 * Generate a map including an optional line and markers
 */
export async function staticMap({
  style = DEFAULT_STYLE,
  encodedPolyline,
  strokeColor,
  strokeWidth,
  markers,
}: StaticMapParams): Promise<CallToolResult> {
  const payload: any = {
    // Fixed at 600x400; customize as needed
    size: "600x400@2x",
    lines: [],
  };

  // Add line if provided
  if (encodedPolyline) {
    // Create the line object
    const line: any = {
      shape: encodedPolyline,
    };

    // Add optional line properties if provided
    if (strokeColor) line.stroke_color = strokeColor;
    if (strokeWidth) line.stroke_width = strokeWidth;

    payload.lines.push(line);
  }

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

  return generateStaticMapAsCallToolResult(payload, style);
}
