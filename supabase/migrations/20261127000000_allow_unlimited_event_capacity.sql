-- A NULL max_players value represents an event with no capacity limit.
ALTER TABLE events ALTER COLUMN max_players DROP NOT NULL;
