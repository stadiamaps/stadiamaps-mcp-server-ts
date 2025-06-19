// Mock response for route API
export const routeFixture = {
  trip: {
    locations: [
      {
        type: "break",
        lat: 60.534715,
        lon: -149.543469,
        original_index: 0,
      },
      {
        type: "break",
        lat: 60.53499,
        lon: -149.54858,
        original_index: 1,
      },
    ],
    legs: [
      {
        summary: {
          has_time_restrictions: false,
          has_toll: false,
          has_highway: false,
          has_ferry: false,
          min_lat: 60.534715,
          min_lon: -149.54858,
          max_lat: 60.535008,
          max_lon: -149.543469,
          time: 11.487,
          length: 0.176,
          cost: 56.002,
        },
        shape: "wzvmrBxalf|GcCrX}A|Nu@jI}@pMkBtZ{@x^_Afj@Inn@`@veB",
      },
    ],
    summary: {
      has_time_restrictions: false,
      has_toll: false,
      has_highway: false,
      has_ferry: false,
      min_lat: 60.534715,
      min_lon: -149.54858,
      max_lat: 60.535008,
      max_lon: -149.543469,
      time: 11.487,
      length: 0.176,
      cost: 56.002,
    },
    status_message: "Found route between points",
    status: 0,
    units: "miles",
    language: "en-US",
  },
};
