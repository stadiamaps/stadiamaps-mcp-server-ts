import { http, HttpResponse } from "msw";
import { isochroneTimeFixture } from "./fixtures/isochroneTime.js";
import { routeFixture } from "./fixtures/route.js";
import { staticMapFixture } from "./fixtures/staticMap.js";
import {
  geocodingSearchFixture,
  geocodingBulkFixture,
} from "./fixtures/geocoding.js";
import { timezoneFixture } from "./fixtures/timezone.js";

// Define handlers for different API endpoint
// FIXME: None of these appear to actually work. See specific test cases for details on endpoint strings or regular expressions that actually work.
export const handlers = [
  // Isochrone API handler
  http.post("*/isochrone/v1", () => {
    return HttpResponse.json(isochroneTimeFixture);
  }),

  // Route API handler
  http.post("*/route/v1", () => {
    return HttpResponse.json(routeFixture);
  }),

  // Static Maps API handler
  http.post("*/static_cacheable*", () => {
    // Return a mock PNG image as buffer
    return HttpResponse.arrayBuffer(staticMapFixture);
  }),

  // Geocoding API handlers
  http.get("*/v2/search*", () => {
    return HttpResponse.json(geocodingSearchFixture);
  }),

  http.post("*/search/bulk*", () => {
    return HttpResponse.json(geocodingBulkFixture);
  }),

  // Timezone API handler
  http.get("*/tz/lookup/v1*", ({ request }) => {
    console.log("Debug - Timezone handler called with URL:", request.url);
    console.log("Debug - Returning fixture:", timezoneFixture);
    return HttpResponse.json(timezoneFixture);
  }),
];
