import type { ProviderDefinition } from "../../core/types.ts";

import { googleMapsActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "google_maps",
  displayName: "Google Maps",
  categories: ["Location", "Developer Tools"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "GOOGLE_MAPS_API_KEY",
      description:
        "Google Maps Platform API key used with the Places, Geocoding, and Routes APIs. Create and restrict it in the Google Cloud Console: https://developers.google.com/maps/get-started#create-project-account-key",
      extraFields: [],
    },
  ],
  homepageUrl: "https://mapsplatform.google.com/",
  actions: googleMapsActions,
};
