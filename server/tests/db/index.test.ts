import {
  addParticipant,
  deleteEventRow,
  ensureUserRow,
  getOrCreateVenueId,
  getEventRows,
  getParticipantStatus,
  getSportId,
  insertEventRow,
  updateEventRow,
  updateEventStatus,
} from "../../src/db";
import { supabase } from "../../src/db/client";

jest.mock("../../src/db/client", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockedSupabase = jest.mocked(supabase);

function createQueryBuilder(
  result: { data: unknown; error: Error | null },
  insertResult = result,
) {
  const query = {
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
    eq: jest.fn(),
    gte: jest.fn(),
    lt: jest.fn(),
    limit: jest.fn(),
    match: jest.fn(),
    update: jest.fn(),
    maybeSingle: jest.fn(),
    single: jest.fn(),
    then: jest.fn((resolve) => resolve(result)),
  };

  query.select.mockReturnValue(query);
  query.insert.mockReturnValue(query);
  query.delete.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.gte.mockReturnValue(query);
  query.lt.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  query.match.mockReturnValue(query);
  query.update.mockReturnValue(query);
  query.maybeSingle.mockReturnValue(result);
  query.single.mockReturnValue(insertResult);

  return query;
}

describe("event database helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("finds the sport id by name", async () => {
    const query = createQueryBuilder({ data: { id: 3 }, error: null });
    mockedSupabase.from.mockReturnValue(query as never);

    await expect(getSportId("Soccer")).resolves.toBe(3);
    expect(mockedSupabase.from).toHaveBeenCalledWith("sports");
    expect(query.select).toHaveBeenCalledWith("id");
    expect(query.eq).toHaveBeenCalledWith("name", "Soccer");
  });

  it("reports when a sport is missing", async () => {
    const query = createQueryBuilder({ data: null, error: null });
    mockedSupabase.from.mockReturnValue(query as never);

    await expect(getSportId("Curling")).rejects.toThrow(
      "getSportId error: sport Curling was not found",
    );
  });

  it("reuses a venue with the requested name", async () => {
    const query = createQueryBuilder({ data: { id: "venue-1" }, error: null });
    mockedSupabase.from.mockReturnValue(query as never);

    await expect(getOrCreateVenueId("Fieldhouse")).resolves.toBe("venue-1");
    expect(mockedSupabase.from).toHaveBeenCalledWith("venues");
    expect(query.eq).toHaveBeenCalledWith("name", "Fieldhouse");
    expect(query.insert).not.toHaveBeenCalled();
  });

  it("creates a venue when the name is not already stored", async () => {
    const query = createQueryBuilder(
      { data: null, error: null },
      { data: { id: "venue-2" }, error: null },
    );
    mockedSupabase.from.mockReturnValue(query as never);

    await expect(getOrCreateVenueId("Custom Court")).resolves.toBe("venue-2");
    expect(query.insert).toHaveBeenCalledWith({ name: "Custom Court" });
    expect(query.select).toHaveBeenCalledWith("id");
  });

  it("inserts an event row and returns its database id", async () => {
    const eventRow = {
      host_id: "host-1",
      sport_id: 3,
      venue_id: "venue-1",
      title: "Soccer Game",
      description: null,
      start_time: "2030-06-15T18:00:00.000Z",
      min_players: 4,
      max_players: null,
      skill_level: "beginner" as const,
      status: "open" as const,
    };
    const query = createQueryBuilder(
      { data: null, error: null },
      { data: { id: "event-1" }, error: null },
    );
    mockedSupabase.from.mockReturnValue(query as never);

    await expect(insertEventRow(eventRow)).resolves.toBe("event-1");
    expect(mockedSupabase.from).toHaveBeenCalledWith("events");
    expect(query.insert).toHaveBeenCalledWith(eventRow);
  });

  it("updates an event row and reports whether a row matched", async () => {
    const query = createQueryBuilder({ data: { id: "event-1" }, error: null });
    mockedSupabase.from.mockReturnValue(query as never);

    await expect(updateEventRow("event-1", { title: "Updated title" })).resolves.toBe(true);
    expect(query.update).toHaveBeenCalledWith({ title: "Updated title" });
    expect(query.eq).toHaveBeenCalledWith("id", "event-1");
  });

  it("returns false when an update matches no event", async () => {
    const query = createQueryBuilder({ data: null, error: null });
    mockedSupabase.from.mockReturnValue(query as never);

    await expect(updateEventRow("missing", { title: "Updated title" })).resolves.toBe(false);
  });

  it("deletes an event row and reports whether a row matched", async () => {
    const query = createQueryBuilder({ data: { id: "event-1" }, error: null });
    mockedSupabase.from.mockReturnValue(query as never);

    await expect(deleteEventRow("event-1")).resolves.toBe(true);
    expect(query.delete).toHaveBeenCalled();
    expect(query.eq).toHaveBeenCalledWith("id", "event-1");
  });

  it("surfaces Supabase errors when inserting an event row", async () => {
    const query = createQueryBuilder(
      { data: null, error: null },
      { data: null, error: new Error("database unavailable") },
    );
    mockedSupabase.from.mockReturnValue(query as never);

    await expect(insertEventRow({
      host_id: "host-1",
      sport_id: 3,
      venue_id: "venue-1",
      title: "Soccer Game",
      description: null,
      start_time: "2030-06-15T18:00:00.000Z",
      min_players: 4,
      max_players: null,
      skill_level: "beginner",
      status: "open",
    })).rejects.toThrow("insertEventRow error: database unavailable");
  });
});

describe("getEventRows", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("applies sport and date filters and normalizes relationship arrays", async () => {
    const query = createQueryBuilder({
      data: [
        {
          id: "event-1",
          title: "Casual 3v3 Runs",
          start_time: "2030-06-15T18:00:00.000Z",
          description: null,
          min_players: 4,
          max_players: 6,
          skill_level: null,
          status: "open",
          host_id: "user-1",
          host: [{ name: "Alex Johnson" }],
          sport: [{ name: "Basketball" }],
          venue: [{ name: "Fieldhouse" }],
          participants: [
            { status: "going", user: [{ name: "Alex Johnson" }] },
          ],
        },
      ],
      error: null,
    });
    mockedSupabase.from.mockReturnValue(query as never);

    const result = await getEventRows({
      sport: "Basketball",
      date: "2030-06-15",
    });

    expect(mockedSupabase.from).toHaveBeenCalledWith("events");
    expect(query.select).toHaveBeenCalledWith(expect.stringContaining("sport:sports!inner(name)"));
    expect(query.eq).toHaveBeenCalledWith("sports.name", "Basketball");
    expect(query.gte).toHaveBeenCalledWith(
      "start_time",
      "2030-06-15T00:00:00.000Z",
    );
    expect(query.lt).toHaveBeenCalledWith(
      "start_time",
      "2030-06-15T23:59:59.999Z",
    );
    expect(result[0].host).toEqual({ name: "Alex Johnson" });
    expect(result[0].participants[0].user).toEqual({ name: "Alex Johnson" });
  });

  it("surfaces Supabase query errors", async () => {
    const query = createQueryBuilder({
      data: null,
      error: new Error("database unavailable"),
    });
    mockedSupabase.from.mockReturnValue(query as never);

    await expect(getEventRows()).rejects.toThrow(
      "getEventRows error: database unavailable",
    );
  });

  it("returns a participant status or null when no participant exists", async () => {
    const query = createQueryBuilder({ data: { status: "going" }, error: null });
    mockedSupabase.from.mockReturnValue(query as never);

    await expect(getParticipantStatus("event-1", "user-1")).resolves.toBe("going");
    expect(query.match).toHaveBeenCalledWith({
      event_id: "event-1",
      user_id: "user-1",
    });
  });

  it("updates an event status", async () => {
    const query = createQueryBuilder({ data: null, error: null });
    mockedSupabase.from.mockReturnValue(query as never);

    await expect(updateEventStatus("event-1", "full")).resolves.toBeUndefined();
    expect(mockedSupabase.from).toHaveBeenCalledWith("events");
    expect(query.update).toHaveBeenCalledWith({ status: "full" });
    expect(query.eq).toHaveBeenCalledWith("id", "event-1");
  });

  it("reactivates a cancelled participant without inserting a duplicate", async () => {
    const query = createQueryBuilder({
      data: { event_id: "event-1", user_id: "user-1", status: "going" },
      error: null,
    });
    mockedSupabase.from.mockReturnValue(query as never);

    await expect(addParticipant("event-1", "user-1")).resolves.toEqual({
      event_id: "event-1",
      user_id: "user-1",
      status: "going",
    });
    expect(query.update).toHaveBeenCalledWith({ status: "going" });
    expect(query.match).toHaveBeenCalledWith({
      event_id: "event-1",
      user_id: "user-1",
      status: "cancelled",
    });
    expect(query.insert).not.toHaveBeenCalled();
  });

  it("inserts a participant when no cancelled row exists", async () => {
    const query = createQueryBuilder(
      { data: null, error: null },
      { data: { event_id: "event-1", user_id: "user-1", status: "going" }, error: null },
    );
    mockedSupabase.from.mockReturnValue(query as never);

    await expect(addParticipant("event-1", "user-1")).resolves.toEqual({
      event_id: "event-1",
      user_id: "user-1",
      status: "going",
    });
    expect(query.insert).toHaveBeenCalledWith([
      { event_id: "event-1", user_id: "user-1", status: "going" },
    ]);
  });

  it("surfaces errors while reactivating a cancelled participant", async () => {
    const query = createQueryBuilder({
      data: null,
      error: new Error("database unavailable"),
    });
    mockedSupabase.from.mockReturnValue(query as never);

    await expect(addParticipant("event-1", "user-1")).rejects.toThrow(
      "addParticipant failed for user user-1 on event event-1: database unavailable",
    );
  });

  it("surfaces errors while inserting a new participant", async () => {
    const query = createQueryBuilder(
      { data: null, error: null },
      { data: null, error: new Error("duplicate participant") },
    );
    mockedSupabase.from.mockReturnValue(query as never);

    await expect(addParticipant("event-1", "user-1")).rejects.toThrow(
      "addParticipant failed for user user-1 on event event-1: duplicate participant",
    );
  });
});

// Creates a student's profile row the first time they sign in (called by the auth service)
describe("ensureUserRow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // What sign-in asks to save for a brand-new student
  const NEW_ROW = {
    id: "user-1",
    name: "jdoe12",
    school_email: "jdoe12@calvin.edu",
    email_verified: true,
    email_verified_at: "2026-11-13T12:00:00Z",
  };

  it("inserts the row, or leaves an existing row alone (insert-or-ignore on id)", async () => {
    const upsert = jest.fn().mockResolvedValue({ data: null, error: null });
    mockedSupabase.from.mockReturnValue({ upsert } as never);

    await expect(ensureUserRow(NEW_ROW)).resolves.toBeUndefined();

    expect(mockedSupabase.from).toHaveBeenCalledWith("users");
    // ignoreDuplicates makes this INSERT ... ON CONFLICT (id) DO NOTHING, so a name or bio the
    // student has already edited is never overwritten by these sign-in defaults
    expect(upsert).toHaveBeenCalledWith(NEW_ROW, { onConflict: "id", ignoreDuplicates: true });
  });

  it("throws a clear error when the database refuses the row", async () => {
    const upsert = jest.fn().mockResolvedValue({
      data: null,
      error: { message: "duplicate key value violates unique constraint" },
    });
    mockedSupabase.from.mockReturnValue({ upsert } as never);

    await expect(ensureUserRow(NEW_ROW)).rejects.toThrow(
      "ensureUserRow failed for user user-1: duplicate key value violates unique constraint",
    );
  });
});
