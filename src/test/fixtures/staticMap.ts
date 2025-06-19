// Mock image in base64 format
const base64Image =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

// Convert to ArrayBuffer for MSW response
export const staticMapFixture = Buffer.from(base64Image, "base64").buffer;
