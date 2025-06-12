import { Configuration } from "@stadiamaps/api";

const API_KEY = process.env.API_KEY || '';
export const apiConfig = new Configuration({ apiKey: API_KEY });
