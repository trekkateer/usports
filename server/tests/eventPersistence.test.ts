import type { DatabaseEventRow } from "../src/repositories/eventRepository";
import type { EventRowFilter, NewEventRow } from "../src/db";
import type { EventStatus } from "../src/types/event";

const persistedRows: DatabaseEventRow[] = [];
const sportIds = new Map<string, number>();
const sportNames = new Map<number, string>();
const venueIds = new Map<string, string>();
const venueNames = new Map<string, string>();
const userNames = new Map<string, string>();
let nextEventId = 1;

type EventServiceModule = typeof import("../src/services/eventService");

function loadEventService(): EventServiceModule {
  let eventService!: EventServiceModule;
  jest.isolateModules(() => {
    eventService = require("../src/services/eventService") as EventServiceModule;
  });
  return eventService;
}

describe("event persistence across service reloads", () => {
  beforeEach(() => {
    jest.resetModules();
    persistedRows.length = 0;
    sportIds.clear();
    sportNames.clear();
    venueIds.clear();
    venueNames.clear();
    userNames.clear();
    nextEventId = 1;
    sportIds.set("Soccer", 1);
    sportNames.set(1, "Soccer");
    userNames.set("user-1", "Taylor");

    jest.doMock("../src/db", () => ({
      addParticipant: jest.fn(async (eventId: string, userId: string) => {
        const event = persistedRows.find((row) => row.id === eventId);
        if (!event) throw new Error(`Unknown event ${eventId}`);
        event.participants.push({
          status: "going",
          user: { name: userNames.get(userId) ?? "Unknown player" },
        });
        return {};
      }),
      getEventRows: jest.fn(async (filters: EventRowFilter = {}) =>
        persistedRows.filter((event) =>
          (filters.sport === undefined || event.sport.name === filters.sport) &&
          (filters.date === undefined || event.start_time.startsWith(filters.date)),
        ),
      ),
      getOrCreateVenueId: jest.fn(async (name: string) => {
        let id = venueIds.get(name);
        if (!id) {
          id = `venue-${venueIds.size + 1}`;
          venueIds.set(name, id);
          venueNames.set(id, name);
        }
        return id;
      }),
      getSportId: jest.fn(async (name: string) => {
        const id = sportIds.get(name);
        if (id === undefined) throw new Error(`Unknown sport ${name}`);
        return id;
      }),
      insertEventRow: jest.fn(async (event: NewEventRow) => {
        const id = `event-${nextEventId++}`;
        const row: DatabaseEventRow = {
          id,
          ...event,
          host: { name: userNames.get(event.host_id) ?? "Unknown host" },
          sport: { name: sportNames.get(event.sport_id) ?? "Unknown sport" },
          venue: { name: venueNames.get(event.venue_id) ?? "Unknown venue" },
          participants: [],
        };
        persistedRows.push(row);
        return id;
      }),
      updateEventStatus: jest.fn(async (_eventId: string, _status: EventStatus) => {}),
    }));
  });

  it("keeps a hosted game available to a freshly loaded feed", async () => {
    const initialService = loadEventService();
    const created = await initialService.createEvent(
      {
        sport: "Soccer",
        venue: "Gainey",
        dateTime: "2030-06-15T18:00:00.000Z",
        minPlayers: 4,
        skillLevel: "Beginner",
        host: "Taylor",
      },
      "user-1",
    );

    expect(created.id).toBe("event-1");
    expect(created.hostId).toBe("user-1");
    expect(created.roster).toEqual(["Taylor"]);

    jest.resetModules();
    const reloadedService = loadEventService();
    const feed = await reloadedService.listEvents({});

    expect(feed).toContainEqual(
      expect.objectContaining({
        id: "event-1",
        hostId: "user-1",
        name: "Taylor's Soccer Game",
        headcount: "1/4 joined",
      }),
    );
  });
});
