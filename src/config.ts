import { Configuration } from "@stadiamaps/api";

// TODO: Can we throw an exception?
export const API_KEY = process.env.API_KEY || "";
export const apiConfig = new Configuration({ apiKey: API_KEY });
