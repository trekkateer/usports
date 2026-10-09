import { Event } from "../types/event";

export const mockEvents: Event[] = [
  {
    id: "1",
    name: "John D.'s Basketball Game",
    sport: "Basketball",
    venue: "Spoelhof Fieldhouse",
    dateTime: "2026-10-10T19:00:00.000Z",
    joinedCount: 6,
    minPlayers: 10,
    skillLevel: "Intermediate",
    host: "John D.",
    roster: [
      "John D.",
      "Sarah M.",
      "Mike T.",
      "David L.",
      "Emma W.",
      "Chris P.",
    ],
  },
  {
    id: "2",
    name: "Alex B.'s Soccer Game",
    sport: "Soccer",
    venue: "Gainey Athletic Complex",
    dateTime: "2026-10-11T17:30:00.000Z",
    joinedCount: 2,
    minPlayers: 14,
    skillLevel: "Beginner",
    host: "Alex B.",
    roster: ["Alex B.", "Gary L."],
  },
];