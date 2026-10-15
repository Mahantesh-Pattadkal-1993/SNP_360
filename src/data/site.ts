// Site-level facts confirmed by the stakeholder (requirements.md §5.4).
// Per-wing/amenity coordinates are NOT yet available — do not fabricate them.

export const site = {
  name: "Sobha Neopolis",
  tagline: "A gated society in Panathur, East Bengaluru — explored in day and night.",
  address: "Panathur Main Road, Off Marathahalli-ORR, Bengaluru – 560087",
  plusCode: "WPM8+CMW, Panathur, Bengaluru, Karnataka 560087",
  latitude: 12.933570273412837,
  longitude: 77.71666228465476,
  wingCount: 19,
};

export const siteMapsEmbedUrl = `https://www.google.com/maps?q=${site.latitude},${site.longitude}&z=17&output=embed`;
export const siteDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${site.latitude},${site.longitude}`;
