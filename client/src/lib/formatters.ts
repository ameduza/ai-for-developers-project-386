import type { TimeSlot } from "@/lib/api/generated";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

export function formatTimeSlot(timeSlot: TimeSlot) {
  const start = new Date(timeSlot.startTime);
  const end = new Date(timeSlot.endTime);

  return `${dateFormatter.format(start)} · ${timeFormatter.format(start)}–${timeFormatter.format(end)} UTC`;
}
