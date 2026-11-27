import * as database from "../../src/db";
import {
  addEvent,
  getAllEvents,
  getEventById,
  mapDatabaseEvent,
  addEventParticipant,
  deleteEvent,
  removeEventParticipant,
  updateEvent,
} from "../../src/repositories/eventRepository";

jest.mock("../../src/db", () => ({
  addParticipant: jest.fn(),
  deleteEventRow: jest.fn(),
  getOrCreateVenueId: jest.fn(),
  getEventRows: jest.fn(),
  getSportId: jest.fn(),
  insertEventRow: jest.fn(),
  removeParticipant: jest.fn(),
  updateEventRow: jest.fn(),
  updateEventStatus: jest.fn(),
}));

const mockedAddParticipant = jest.mocked(database.addParticipant);
const mockedDeleteEventRow = jest.mocked(database.deleteEventRow);
const mockedGetOrCreateVenueId = jest.mocked(database.getOrCreateVenueId);
const mockedGetEventRows = jest.mocked(database.getEventRows);
const mockedGetSportId = jest.mocked(database.getSportId);
const mockedInsertEventRow = jest.mocked(database.insertEventRow);
const mockedUpdateEventRow = jest.mocked(database.updateEventRow);
const mockedRemoveParticipant = jest.mocked(database.removeParticipant);
const mockedUpdateEventStatus = jest.mocked(database.updateEventStatus);

describe("mapDatabaseEvent", () => {
  it("maps the database event shape and preserves a null skill level", () => {
    const result = mapDatabaseEvent({
      id: "eeeeeee1-1111-1111-1111-111111111111",
      title: "Casual 3v3 Runs",
      start_time: "2030-06-15T18:00:00.000Z",
      description: "Bring light and dark shirts.",
      min_players: 4,
      max_players: 6,
      skill_level: null,
      status: "open",
      host_id: "user-1",
      host: { name: "Alex Johnson" },
      sport: { name: "Basketball" },
      venue: { name: "Spoelhof Fieldhouse Court 1" },
      participants: [
        { user: { name: "Alex Johnson" }, status: "going" },
        { user: { name: "Jordan Smith" }, status: "going" },
        { user: { name: "Taylor Kim" }, status: "cancelled" },
      ],
    });

    expect(result).toEqual({
      id: "eeeeeee1-1111-1111-1111-111111111111",
      name: "Casual 3v3 Runs",
      sport: "Basketball",
      venue: "Spoelhof Fieldhouse Court 1",
      dateTime: "2030-06-15T18:00:00.000Z",
      joinedCount: 2,
      minPlayers: 4,
      maxPlayers: 6,
      skillLevel: null,
      status: "open",
      hostId: "user-1",
      host: "Alex Johnson",
      roster: ["Alex Johnson", "Jordan Smith"],
      description: "Bring light and dark shirts.",
    });
  });

  it("maps a full event without adding a description when the database value is null", () => {
    const result = mapDatabaseEvent({
      id: "eeeeeee2-2222-2222-2222-222222222222",
      title: "1v1 Tennis Rally",
      start_time: "2030-06-16T18:00:00.000Z",
      description: null,
      min_players: 2,
      max_players: 2,
      skill_level: "intermediate",
      status: "full",
      host_id: "user-2",
      host: { name: "Jordan Smith" },
      sport: { name: "Tennis" },
      venue: { name: "Spoelhof Fieldhouse Court 1" },
      participants: [
        { user: { name: "Jordan Smith" }, status: "going" },
        { user: { name: "Taylor Kim" }, status: "going" },
      ],
    });

    expect(result).toEqual({
      id: "eeeeeee2-2222-2222-2222-222222222222",
      name: "1v1 Tennis Rally",
      sport: "Tennis",
      venue: "Spoelhof Fieldhouse Court 1",
      dateTime: "2030-06-16T18:00:00.000Z",
      joinedCount: 2,
      minPlayers: 2,
      maxPlayers: 2,
      skillLevel: "Intermediate",
      status: "full",
      hostId: "user-2",
      host: "Jordan Smith",
      roster: ["Jordan Smith", "Taylor Kim"],
    });
  });
});

describe("event repository reads", () => {
  const row = {
    id: "event-1",
    title: "Casual 3v3 Runs",
    start_time: "2030-06-15T18:00:00.000Z",
    description: null,
    min_players: 4,
    max_players: 6,
    skill_level: null,
    status: "open" as const,
    host_id: "user-1",
    host: { name: "Alex Johnson" },
    sport: { name: "Basketball" },
    venue: { name: "Fieldhouse" },
    participants: [
      { status: "going" as const, user: { name: "Alex Johnson" } },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedDeleteEventRow.mockResolvedValue(true);
    mockedGetOrCreateVenueId.mockResolvedValue("venue-1");
    mockedGetSportId.mockResolvedValue(1);
    mockedInsertEventRow.mockResolvedValue("event-new");
    mockedUpdateEventRow.mockResolvedValue(true);
    mockedUpdateEventStatus.mockResolvedValue();
  });

  it("loads and maps all event rows with filters", async () => {
    mockedGetEventRows.mockResolvedValue([row]);

    const result = await getAllEvents({
      sport: "Basketball",
      date: "2030-06-15",
    });

    expect(mockedGetEventRows).toHaveBeenCalledWith({
      sport: "Basketball",
      date: "2030-06-15",
    });
    expect(result[0].name).toBe("Casual 3v3 Runs");
  });

  it("loads one event by id", async () => {
    mockedGetEventRows.mockResolvedValue([row]);

    const result = await getEventById("event-1");

    expect(mockedGetEventRows).toHaveBeenCalledWith({});
    expect(result?.id).toBe("event-1");
  });

  it("returns undefined when an event id is not found", async () => {
    mockedGetEventRows.mockResolvedValue([]);

    await expect(getEventById("missing")).resolves.toBeUndefined();
  });

  it("adds a participant and reloads the updated event", async () => {
    mockedAddParticipant.mockResolvedValue({});
    mockedGetEventRows.mockResolvedValue([row]);

    await expect(addEventParticipant("event-1", "user-1")).resolves.toEqual(
      expect.objectContaining({ id: "event-1" }),
    );

    expect(mockedAddParticipant).toHaveBeenCalledWith("event-1", "user-1");
  });

  it("cancels a participant and reloads the updated event", async () => {
    mockedRemoveParticipant.mockResolvedValue({});
    mockedGetEventRows.mockResolvedValue([row]);

    await expect(removeEventParticipant("event-1", "user-1")).resolves.toEqual(
      expect.objectContaining({ id: "event-1" }),
    );

    expect(mockedRemoveParticipant).toHaveBeenCalledWith("event-1", "user-1");
  });

  it("persists full status when a join reaches capacity", async () => {
    const fullRow = {
      ...row,
      max_players: 1,
      participants: [
        { status: "going" as const, user: { name: "Alex Johnson" } },
      ],
    };
    mockedAddParticipant.mockResolvedValue({});
    mockedGetEventRows.mockResolvedValue([fullRow]);

    const result = await addEventParticipant("event-1", "user-2");

    expect(result?.status).toBe("full");
    expect(mockedUpdateEventStatus).toHaveBeenCalledWith("event-1", "full");
  });

  it("reopens a full event after a participant leaves", async () => {
    const fullRow = {
      ...row,
      status: "full" as const,
      max_players: 2,
      participants: [
        { status: "going" as const, user: { name: "Alex Johnson" } },
      ],
    };
    mockedRemoveParticipant.mockResolvedValue({});
    mockedGetEventRows.mockResolvedValue([fullRow]);

    const result = await removeEventParticipant("event-1", "user-1");

    expect(result?.status).toBe("open");
    expect(mockedUpdateEventStatus).toHaveBeenCalledWith("event-1", "open");
  });

  it("creates an event row and adds the authenticated host as its first participant", async () => {
    const newRow = {
      ...row,
      id: "event-new",
      title: "Alex's Soccer Game",
      host_id: "user-1",
      sport: { name: "Soccer" },
      participants: [
        { status: "going" as const, user: { name: "Alex Johnson" } },
      ],
    };
    mockedGetEventRows.mockResolvedValue([newRow]);
    mockedInsertEventRow.mockResolvedValue("event-new");

    const result = await addEvent({
      id: "temporary-id",
      name: "Alex's Soccer Game",
      sport: "Soccer",
      venue: "Fieldhouse",
      dateTime: "2030-06-15T18:00:00.000Z",
      joinedCount: 1,
      minPlayers: 4,
      maxPlayers: 6,
      skillLevel: "Intermediate",
      status: "open",
      hostId: "user-1",
      host: "Alex Johnson",
      roster: ["Alex Johnson"],
      description: "Bring a light shirt.",
    }, "user-1");

    expect(mockedGetSportId).toHaveBeenCalledWith("Soccer");
    expect(mockedGetOrCreateVenueId).toHaveBeenCalledWith("Fieldhouse");
    expect(mockedInsertEventRow).toHaveBeenCalledWith({
      host_id: "user-1",
      sport_id: 1,
      venue_id: "venue-1",
      title: "Alex's Soccer Game",
      description: "Bring a light shirt.",
      start_time: "2030-06-15T18:00:00.000Z",
      min_players: 4,
      max_players: 6,
      skill_level: "intermediate",
      status: "open",
    });
    expect(mockedAddParticipant).toHaveBeenCalledWith("event-new", "user-1");
    expect(result.id).toBe("event-new");
    expect(result.roster).toEqual(["Alex Johnson"]);
  });

  it("maps event edits to database columns", async () => {
    const updatedRow = {
      ...row,
      title: "Updated game",
      sport: { name: "Soccer" },
      venue: { name: "New Fieldhouse" },
      start_time: "2030-06-16T18:00:00.000Z",
      description: "Updated details",
      min_players: 3,
      max_players: 5,
      skill_level: "advanced" as const,
      status: "cancelled" as const,
    };
    mockedGetEventRows
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce([updatedRow]);
    mockedGetSportId.mockResolvedValue(2);
    mockedGetOrCreateVenueId.mockResolvedValue("venue-2");

    const result = await updateEvent("event-1", {
      name: "Updated game",
      sport: "Soccer",
      venue: "New Fieldhouse",
      dateTime: "2030-06-16T18:00:00.000Z",
      description: "Updated details",
      minPlayers: 3,
      maxPlayers: 5,
      skillLevel: "Advanced",
      status: "cancelled",
    });

    expect(mockedUpdateEventRow).toHaveBeenCalledWith("event-1", {
      title: "Updated game",
      sport_id: 2,
      venue_id: "venue-2",
      start_time: "2030-06-16T18:00:00.000Z",
      description: "Updated details",
      min_players: 3,
      max_players: 5,
      skill_level: "advanced",
      status: "cancelled",
    });
    expect(result?.name).toBe("Updated game");
    expect(result?.skillLevel).toBe("Advanced");
  });

  it("deletes an existing event row", async () => {
    mockedGetEventRows.mockResolvedValue([row]);

    await expect(deleteEvent("event-1")).resolves.toBe(true);

    expect(mockedDeleteEventRow).toHaveBeenCalledWith("event-1");
  });
});
