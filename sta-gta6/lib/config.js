export const ZONE = {
  name: "Shadow Tournament Arena",
  game: "Grand Theft Auto VI",
  launch: "2026-11-19",
};
export const CONSOLES = [
  { id: 1, label: "PS5 One" },
  { id: 2, label: "PS5 Two" },
];
export const OPEN = 14; // 2 PM
export const CLOSE = 26; // 2 AM next day (hours past 24 belong to the same arena day)
export const MAX_HOURS = CLOSE - OPEN;
export const ADVANCE_DAYS = 90; // how far ahead people can book
export const RATE = 700; // PKR per console-hour
export const BULK_RATE = 600; // PKR per console-hour when a console is booked for BULK_FROM+ hours
export const BULK_FROM = 3;
