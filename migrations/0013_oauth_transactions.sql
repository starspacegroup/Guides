-- One-time OAuth login/link transactions. D1 stores only state/session digests.
CREATE TABLE IF NOT EXISTS oauth_transactions (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK(provider IN ('github', 'discord')),
  intent TEXT NOT NULL CHECK(intent IN ('login', 'link')),
  user_id TEXT,
  session_id TEXT,
  expires_at DATETIME NOT NULL,
  consumed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(
    (intent = 'login' AND user_id IS NULL AND session_id IS NULL)
    OR (intent = 'link' AND user_id IS NOT NULL AND session_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_oauth_transactions_expires_at
  ON oauth_transactions(expires_at);
