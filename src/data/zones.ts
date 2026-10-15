// Amenity zones & pins, transcribed from the master-plan legend
// (requirements.md §5.2). Numbered pin IDs match the markers visible on the
// campus plan images where legible; purely descriptive otherwise.

export type ZoneKey = "kids" | "active" | "park-plaza" | "recreational";

export interface Zone {
  key: ZoneKey;
  label: string;
  colorClass: string; // tailwind text/bg accent for pin + filter chip
  amenities: string[];
}

export const zones: Zone[] = [
  {
    key: "kids",
    label: "Kids Zone",
    colorClass: "bg-amber-400",
    amenities: ["Aqua Park", "Toddlers Pad", "Cycling Track", "Skating Lane", "Play Park"],
  },
  {
    key: "active",
    label: "Active Zone",
    colorClass: "bg-emerald-500",
    amenities: [
      "Reflexology Walk",
      "Basketball Court",
      "Jogging Park",
      "Fitness Corner",
      "Activity Field",
      "Grecian Trail",
      "Leisure Pool",
      "Tennis Court",
    ],
  },
  {
    key: "park-plaza",
    label: "Park & Plaza Zone",
    colorClass: "bg-sky-500",
    amenities: [
      "Entrance Plaza",
      "Fiesta Park",
      "Portico",
      "Amphitheatre",
      "Olympus Plaza",
      "BBQ & Picnic Park",
      "Celebration Lawn",
      "Pergola Trail",
      "Outdoor Workspace",
      "Cascading Waters",
      "Foliage Cross",
      "Moon Garden",
    ],
  },
  {
    key: "recreational",
    label: "Recreational Zone",
    colorClass: "bg-violet-500",
    amenities: [
      "Club Athinios",
      "Meandering Pool",
      "Floating Deck",
      "Eco Pond",
      "Club Santorini",
      "Senior's Corner",
      "Club Syros",
      "Santorini Village",
      "Bonfire Court",
      "Meditation Pads",
      "Bio Pond",
    ],
  },
];
