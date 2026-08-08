-- Provider tokens are callback-only credentials; retain account links, not access.
UPDATE oauth_accounts
SET access_token = NULL,
    refresh_token = NULL
WHERE access_token IS NOT NULL
   OR refresh_token IS NOT NULL;
