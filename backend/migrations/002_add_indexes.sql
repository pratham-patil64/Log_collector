CREATE INDEX IF NOT EXISTS idx_logs_app_time
ON logs (app_name, received_at DESC);

-- Filter by severity
CREATE INDEX IF NOT EXISTS idx_logs_level
ON logs (level);

-- Filter by service
CREATE INDEX IF NOT EXISTS idx_logs_service
ON logs (service);

-- Fast metadata search
CREATE INDEX IF NOT EXISTS idx_logs_metadata
ON logs USING GIN (metadata);