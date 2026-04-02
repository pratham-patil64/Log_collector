CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  app_name TEXT NOT NULL,
  service TEXT NOT NULL,
  environment TEXT NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL,
  url TEXT,
  metadata JSONB
);