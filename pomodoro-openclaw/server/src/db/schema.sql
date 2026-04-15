CREATE TABLE IF NOT EXISTS tasks (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  name        TEXT NOT NULL,
  estimate    INTEGER NOT NULL DEFAULT 1,
  completed   INTEGER NOT NULL DEFAULT 0,
  tags        TEXT DEFAULT '[]',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  task_id      TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  task_name    TEXT,
  type         TEXT NOT NULL CHECK(type IN ('focus','short_break','long_break')),
  duration_sec INTEGER NOT NULL,
  interrupted  INTEGER NOT NULL DEFAULT 0,
  source       TEXT NOT NULL DEFAULT 'manual' CHECK(source IN ('manual','openclaw')),
  started_at   TEXT NOT NULL,
  ended_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO settings VALUES
  ('focus_duration', '1500'),
  ('short_break_duration', '300'),
  ('long_break_duration', '900'),
  ('auto_advance', 'true'),
  ('long_break_interval', '4');
