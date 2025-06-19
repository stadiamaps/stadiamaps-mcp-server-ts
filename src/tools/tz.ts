import { GeospatialApi } from "@stadiamaps/api";
import { apiConfig } from "../config.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { Coordinates } from "../types.js";
import { handleToolError } from "../errorHandler.js";

const miscApi = new GeospatialApi(apiConfig);

export async function timeAndZoneInfo({
  lat,
  lon,
}: Coordinates): Promise<CallToolResult> {
  return handleToolError(
    async () => {
      const res = await miscApi.tzLookup({
        lat,
        lng: lon,
      });

      return {
        content: [
          {
            type: "text",
            text: [
              `TZID: ${res.tzId}`,
              `Standard UTC offset: ${res.baseUtcOffset}`,
              `Special offset (e.g. DST): ${res.dstOffset}`,
              `Current time (RFC 2822): ${res.localRfc2822Timestamp}`,
            ].join("\n"),
          },
        ],
      };
    },
    {
      contextMessage: "Timezone lookup failed",
      enableLogging: true,
    },
  );
}
