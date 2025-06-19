export const geocodingSearchFixture = {
  geocoding: {
    attribution: "https://stadiamaps.com/attribution/",
    query: {
      size: 1,
      text: "Telliskivi 60a/3",
    },
  },
  type: "FeatureCollection",
  bbox: [24.729598, 59.439934, 24.729598, 59.439934],
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [24.729598, 59.439934],
      },
      properties: {
        gid: "openstreetmap:address:way/884123372",
        layer: "address",
        sources: [
          {
            source: "openstreetmap",
            source_id: "way/884123372",
            fixit_url: "https://www.openstreetmap.org/edit?way=884123372",
          },
        ],
        precision: "centroid",
        confidence: 1,
        name: "Telliskivi 60a/3",
        formatted_address_lines: [
          "Telliskivi 60a/3",
          "10412 Tallinn",
          "Estonia",
        ],
        formatted_address_line: "Telliskivi 60a/3, 10412 Tallinn, Estonia",
        coarse_location: "Tallinn, Harju, Estonia",
        address_components: {
          number: "60a/3",
          street: "Telliskivi",
          postal_code: "10412",
        },
        context: {
          whosonfirst: {
            country: {
              gid: "whosonfirst:country:85633135",
              name: "Estonia",
              abbreviation: "EST",
            },
            region: {
              gid: "whosonfirst:region:85683055",
              name: "Harju",
              abbreviation: "HA",
            },
            county: {
              gid: "whosonfirst:county:1713305645",
              name: "Tallinn",
            },
            borough: {
              gid: "whosonfirst:borough:1713348883",
              name: "Pőhja-Tallinna",
            },
            neighbourhood: {
              gid: "whosonfirst:neighbourhood:85907859",
              name: "Kelmiküla",
            },
            locality: {
              gid: "whosonfirst:locality:101748153",
              name: "Tallinn",
            },
            localadmin: {
              gid: "whosonfirst:localadmin:1713306175",
              name: "Pőhja-Tallinna",
            },
          },
          iso_3166_a2: "EE",
          iso_3166_a3: "EST",
        },
        match_type: "match",
      },
    },
  ],
};

// Mock response for bulk geocoding API
export const geocodingBulkFixture = [
  {
    response: {
      bbox: [24.729542, 59.439221, 24.730996, 59.43998],
      features: [
        {
          geometry: {
            coordinates: [24.729598, 59.439934],
            type: "Point",
          },
          properties: {
            accuracy: "centroid",
            borough: "Pőhja-Tallinna",
            borough_gid: "whosonfirst:borough:1713348883",
            confidence: 1.0,
            country: "Estonia",
            country_a: "EST",
            country_code: "EE",
            country_gid: "whosonfirst:country:85633135",
            county: "Tallinn",
            county_gid: "whosonfirst:county:1713305645",
            gid: "openstreetmap:address:way/884123372",
            housenumber: "60a/3",
            id: "way/884123372",
            label: "Telliskivi 60a/3, Tallinn, Harju, Estonia",
            layer: "address",
            localadmin: "Pőhja-Tallinna",
            localadmin_gid: "whosonfirst:localadmin:1713306175",
            locality: "Tallinn",
            locality_gid: "whosonfirst:locality:101748153",
            match_type: "exact",
            name: "Telliskivi 60a/3",
            neighbourhood: "Kelmiküla",
            neighbourhood_gid: "whosonfirst:neighbourhood:85907859",
            postalcode: "10412",
            region: "Harju",
            region_a: "HA",
            region_gid: "whosonfirst:region:85683055",
            source: "openstreetmap",
            source_id: "way/884123372",
            street: "Telliskivi",
          },
          type: "Feature",
        },
      ],
      geocoding: {
        attribution: "https://stadiamaps.com/attribution/",
        query: {
          text: "Telliskivi 60a/3, Tallinn",
        },
      },
      type: "FeatureCollection",
    },
    status: 200,
  },
  {
    response: {
      bbox: [-82.399866, 34.852043, -82.399866, 34.852043],
      features: [
        {
          geometry: {
            coordinates: [-82.399866, 34.852043],
            type: "Point",
          },
          properties: {
            accuracy: "point",
            confidence: 1.0,
            country: "United States",
            country_a: "USA",
            country_code: "US",
            country_gid: "whosonfirst:country:85633793",
            county: "Greenville County",
            county_a: "GV",
            county_gid: "whosonfirst:county:102085747",
            gid: "openstreetmap:address:node/8397935966",
            housenumber: "101",
            id: "node/8397935966",
            label: "101 North Main Street, Greenville, SC, USA",
            layer: "address",
            locality: "Greenville",
            locality_gid: "whosonfirst:locality:101721075",
            match_type: "exact",
            name: "101 North Main Street",
            postalcode: "29601",
            region: "South Carolina",
            region_a: "SC",
            region_gid: "whosonfirst:region:85688683",
            source: "openstreetmap",
            source_id: "node/8397935966",
            street: "North Main Street",
          },
          type: "Feature",
        },
      ],
      geocoding: {
        attribution: "https://stadiamaps.com/attribution/",
        query: {
          text: "101 N Main St, Greenville SC",
        },
      },
      type: "FeatureCollection",
    },
    status: 200,
  },
];
