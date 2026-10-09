import { mockEvents } from "../data/events";
import { Event, UpdateEventInput } from "../types/event";

let events: Event[] = structuredClone(mockEvents);

export function getAllEvents(): Event[] {
  return events;
}

export function getEventById(id: string): Event | undefined {
  return events.find((event) => event.id === id);
}

export function addEvent(event: Event): Event {
  events = [...events, event];
  return event;
}

export function updateEvent(
  id: string,
  updates: UpdateEventInput,
): Event | undefined {
  const existingEvent = getEventById(id);

  if (!existingEvent) {
    return undefined;
  }

  const updatedEvent: Event = {
    ...existingEvent,
    ...updates,
  };

  events = events.map((event) => (event.id === id ? updatedEvent : event));
  return updatedEvent;
}

export function deleteEvent(id: string): boolean {
  if (!getEventById(id)) {
    return false;
  }

  events = events.filter((event) => event.id !== id);
  return true;
}

export function resetEvents(): void {
  events = structuredClone(mockEvents);
}
