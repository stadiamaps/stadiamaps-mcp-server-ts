/**
 * Common types used across the application
 */

/**
 * Geographic coordinates with latitude and longitude
 */
export type Coordinates = {
  lat: number;
  lon: number;
};

/**
 * Common geocoding parameters
 */
export type GeocodingCommonParams = {
  countryFilter?: Array<string>;
  lang: string;
  focusPoint?: Coordinates;
};
