import {
  addParticipant,
  deleteEventRow,
  EventRowUpdates,
  getOrCreateVenueId,
  getSportId,
  EventRowFilter,
  getEventRows,
  insertEventRow,
  removeParticipant,
  updateEventRow,
  updateEventStatus,
} from "../db";
import { Event, EventStatus, SkillLevel, UpdateEventInput } from "../types/event";

type DatabaseParticipantRow = {
status: "going" | "cancelled";
user: { name: string };
};

export type DatabaseEventRow = {
id: string;
host_id: string;
title: string;
start_time: string;
description: string | null;
min_players: number;
max_players: number | null;
skill_level: DatabaseSkillLevel | null;
status: EventStatus;
host: { name: string };
sport: { name: string };
venue: { name: string };
participants: DatabaseParticipantRow[];
};

type DatabaseSkillLevel = "beginner" | "intermediate" | "advanced";

function toClientSkillLevel(
  skillLevel: DatabaseSkillLevel | null,
): SkillLevel | null {
  if (skillLevel === null) return null;

  return {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
  }[skillLevel] as SkillLevel;
}

export function mapDatabaseEvent(row: DatabaseEventRow): Event {
  const activeParticipants = row.participants.filter(
    (participant) => participant.status === "going",
  );

  return {
    id: row.id,
    hostId: row.host_id,
    name: row.title,
    sport: row.sport.name,
    venue: row.venue.name,
    dateTime: row.start_time,
    joinedCount: activeParticipants.length,
    minPlayers: row.min_players,
    ...(row.max_players === null ? {} : { maxPlayers: row.max_players }),
    skillLevel: toClientSkillLevel(row.skill_level),
    status: row.status,
    host: row.host.name,
    roster: activeParticipants.map((participant) => participant.user.name),
    ...(row.description === null ? {} : { description: row.description }),
  };
}

export async function getAllEvents(filters: EventRowFilter = {}): Promise<Event[]> {
  const rows = await getEventRows(filters);
  return rows.map(mapDatabaseEvent);
}

export async function getEventById(id: string): Promise<Event | undefined> {
  const rows = await getEventRows({});
  const row = rows.find((event) => event.id === id);
  return row ? mapDatabaseEvent(row) : undefined;
}

export async function addEventParticipant(
  eventId: string,
  userId: string,
): Promise<Event | undefined> {
  await addParticipant(eventId, userId);
  const updatedEvent = await getEventById(eventId);

  // Recalculate from active participants so a stale open status cannot allow
  // the response to report an available event after its last spot is taken.
  if (
    updatedEvent?.maxPlayers !== undefined &&
    updatedEvent.joinedCount >= updatedEvent.maxPlayers &&
    updatedEvent.status !== "full"
  ) {
    await updateEventStatus(eventId, "full");
    updatedEvent.status = "full";
  }

  return updatedEvent;
}

export async function removeEventParticipant(
  eventId: string,
  userId: string,
): Promise<Event | undefined> {
  await removeParticipant(eventId, userId);
  const updatedEvent = await getEventById(eventId);

  // Only a full event reopens; cancelled events must retain their terminal status.
  if (updatedEvent?.status === "full") {
    await updateEventStatus(eventId, "open");
    updatedEvent.status = "open";
  }

  return updatedEvent;
}

export async function addEvent(event: Event, hostId: string = event.hostId): Promise<Event> {
  const sportId = await getSportId(event.sport);
  const venueId = await getOrCreateVenueId(event.venue);
  const eventId = await insertEventRow({
    host_id: hostId,
    sport_id: sportId,
    venue_id: venueId,
    title: event.name,
    description: event.description ?? null,
    start_time: event.dateTime,
    min_players: event.minPlayers,
    max_players: event.maxPlayers ?? null,
    skill_level: event.skillLevel?.toLowerCase() as DatabaseSkillLevel | null,
    status: event.status,
  });

  await addParticipant(eventId, hostId);

  const createdEvent = await getEventById(eventId);
  if (!createdEvent) {
    throw new Error(`addEvent error: inserted event ${eventId} could not be reloaded`);
  }

  return createdEvent;
}

export async function updateEvent(
  id: string,
  updates: UpdateEventInput,
): Promise<Event | undefined> {
  const existingEvent = await getEventById(id);

  if (!existingEvent) {
    return undefined;
  }

  const databaseUpdates: EventRowUpdates = {};
  if (updates.name !== undefined) databaseUpdates.title = updates.name;
  if (updates.sport !== undefined) {
    databaseUpdates.sport_id = await getSportId(updates.sport);
  }
  if (updates.venue !== undefined) {
    databaseUpdates.venue_id = await getOrCreateVenueId(updates.venue);
  }
  if (updates.dateTime !== undefined) databaseUpdates.start_time = updates.dateTime;
  if (updates.description !== undefined) databaseUpdates.description = updates.description ?? null;
  if (updates.minPlayers !== undefined) databaseUpdates.min_players = updates.minPlayers;
  if (updates.maxPlayers !== undefined) databaseUpdates.max_players = updates.maxPlayers;
  if (updates.skillLevel !== undefined) {
    databaseUpdates.skill_level = updates.skillLevel?.toLowerCase() as DatabaseSkillLevel | null;
  }
  if (updates.status !== undefined) databaseUpdates.status = updates.status;

  if (Object.keys(databaseUpdates).length === 0) {
    return existingEvent;
  }
  if (!(await updateEventRow(id, databaseUpdates))) {
    return undefined;
  }

  return getEventById(id);
}

export async function deleteEvent(id: string): Promise<boolean> {
  if (!(await getEventById(id))) {
    return false;
  }

  return deleteEventRow(id);
}
