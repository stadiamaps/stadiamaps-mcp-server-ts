import { z } from "zod";
import {
  CostingModel,
  DistanceUnit,
  IsochroneCostingModel,
} from "@stadiamaps/api";
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

export const coordinatesSchema = z
  .object({
    lat: latitudeSchema,
    lon: longitudeSchema,
  })
  .describe("A geographic coordinate pair.");

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

export const focusPointSchema = z
  .object({
    lat: latitudeSchema,
    lon: longitudeSchema,
  })
  .optional()
  .describe(
    "Geographic coordinates to focus the search around. Provide this whenever possible.",
  );

export const geocodingUnstructuredQuery = z
  .string()
  .describe(
    "The address or place name to search for. Use local formatting and order when possible. When searching for a POI name (e.g. 'Starbucks'), you will get better results with a focus point and filters. Avoid spelling out precise locations (e.g. 'Starbucks, Downtown Greenville'); this is acceptable for large areas though (e.g. 'Paris, France' is OK, as is 'Louvre, Paris'). Make multiple queries or use general knowledge when necessary to identify the correct non-textual filters.",
  );

export const geocodingCommonSchema = z.object({
  countryFilter: countryFilterSchema,
  lang: languageSchema,
  focusPoint: focusPointSchema,
  layer: z
    .enum(["address", "poi", "coarse", "country", "region", "locality"])
    .describe(
      "The layer to search in. Coarse searches for areas such as neighborhoods, cities, states, and countries, AND a specific layer is not available. Address searches for street addresses. Country is what you expect. Localities are what we would colloquially refer to as a 'city', town, or village. Region is for first-level subdivisions within countries like states, provinces, or whatever they are called locally. POI searches for points of interest including restaurants, parks, shops, and museums. Defaults to all layers if not specified.",
    )
    .optional(),
});

// Static maps schemas
export const mapStyleSchema = z
  // See https://docs.stadiamaps.com/themes/ for more styles!
  .enum(["outdoors", "alidade_smooth", "alidade_smooth_dark"])
  .describe("The Stadia Maps style slug to use.")
  .default(DEFAULT_STYLE);

export const zoomSchema = z
  .number()
  .min(0)
  .max(18)
  .describe("The map zoom level.");

export const markerLabelSchema = z
  .string()
  .describe(
    "Optional label for the marker. This must be either a single character or supported emoji (most emoji work).",
  )
  .optional();

export const markerColorSchema = z
  .string()
  .describe(
    "Optional color for the marker (hex code or CSS color name; no quoting and no # prefix).",
  )
  .optional();

export const markerStyleSchema = z
  .string()
  .describe("Optional custom marker style or URL to a custom marker image.")
  .optional();

// Routing schemas
export const costingSchema = z
  .nativeEnum(CostingModel)
  .describe("The method of travel to use when routing (auto = automobile).");

export const unitsSchema = z
  .nativeEnum(DistanceUnit)
  .describe("The unit to report distances in.");

// Isochrone schemas
export const isochroneCostingSchema = z
  .nativeEnum(IsochroneCostingModel)
  .describe(
    "The method of travel to use for isochrone calculation (auto = automobile).",
  );

export const contourSchema = z
  .object({
    time: z
      .number()
      .positive()
      .describe(
        "The time in minutes for the contour. Mutually exclusive with distance.",
      )
      .optional(),
    distance: z
      .number()
      .positive()
      .describe(
        "The distance in km for the contour. Mutually exclusive with time.",
      )
      .optional(),
  })
  .refine(
    (data) => (data.time !== undefined) !== (data.distance !== undefined),
    {
      message: "Either time or distance must be specified, but not both.",
    },
  )
  .describe("A contour definition with either time or distance constraint.");

export const contoursSchema = z
  .array(contourSchema)
  .min(1)
  .max(4)
  .describe(
    "Array of 1-4 contours. All contours must be of the same type (all time or all distance).",
  )
  .refine(
    (contours) => {
      const hasTime = contours.some((c) => c.time !== undefined);
      const hasDistance = contours.some((c) => c.distance !== undefined);
      return !(hasTime && hasDistance);
    },
    {
      message:
        "All contours must be of the same type (either all time-based or all distance-based).",
    },
  );
