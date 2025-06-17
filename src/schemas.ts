import { z } from "zod";
import { CostingModel, DistanceUnit } from "@stadiamaps/api";
import { DEFAULT_STYLE } from "./tools/staticMaps.js";

// Coordinate schemas
export const latitudeSchema = z
  .number()
  .min(-90)
  .max(90)
  .describe("The latitude of the point.");

export const longitudeSchema = z
  .number()
  .min(-180)
  .max(180)
  .describe("The longitude of the point.");

export const coordinatesSchema = z.object({
  lat: latitudeSchema,
  lon: longitudeSchema,
}).describe("A geographic coordinate pair.");

// Geocoding schemas
export const countryFilterSchema = z
  .array(
    z
      .string()
      .length(3)
      .describe(
        "An ISO 3166-1 alpha-3 country code to limit the search to (e.g. USA, DEU, EST).",
      ),
  )
  .optional();

export const languageSchema = z
  .string()
  .min(2)
  .describe(
    "A BCP-47 language tag (may just be the language) to localize the results in (e.g. en, de, et).",
  );

// Static maps schemas
export const mapStyleSchema = z
  .string()
  .describe("The map style to use (e.g., outdoors, alidade_smooth).")
  .default(DEFAULT_STYLE);

export const mapSizeSchema = z
  .string()
  .describe(
    "The size of the image in pixels, format: 'widthxheight' (e.g., '600x400').",
  );

export const zoomSchema = z
  .number()
  .min(0)
  .max(18)
  .describe("The zoom level (0-18).");

export const markerLabelSchema = z
  .string()
  .describe("Optional label for the marker.")
  .optional();

export const markerColorSchema = z
  .string()
  .describe("Optional color for the marker (hex code or color name).")
  .optional();

export const markerStyleSchema = z
  .string()
  .describe("Optional custom marker style or URL to a custom marker image.")
  .optional();

// Routing schemas
export const costingSchema = z
  .nativeEnum(CostingModel)
  .describe(
    "The method of travel to use when routing (auto = automobile).",
  );

export const unitsSchema = z
  .nativeEnum(DistanceUnit)
  .describe("The unit to report distances in.");
