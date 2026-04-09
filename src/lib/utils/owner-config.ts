interface OwnerConfigEnv {
  GITHUB_OWNER_ID?: string;
  GITHUB_OWNER_USERNAME?: string;
  KV?: {
    get(key: string): Promise<string | null>;
  };
}

export interface GitHubOwnerConfig {
  ownerId?: string;
  ownerUsername: string | null;
}

function normalizeOwnerValue(value?: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function matchesOwnerUsername(login: string | null | undefined, ownerUsername: string | null): boolean {
  if (!login || !ownerUsername) {
    return false;
  }

  return login.toLowerCase() === ownerUsername.toLowerCase();
}

export async function resolveGitHubOwnerConfig(env?: OwnerConfigEnv): Promise<GitHubOwnerConfig> {
  let ownerId = normalizeOwnerValue(env?.GITHUB_OWNER_ID) ?? undefined;
  let ownerUsername = normalizeOwnerValue(env?.GITHUB_OWNER_USERNAME);

  if (ownerId && Number.isNaN(Number.parseInt(ownerId, 10))) {
    ownerUsername ??= ownerId;
    ownerId = undefined;
  }

  if (env?.KV && (!ownerId || !ownerUsername)) {
    if (!ownerId) {
      const storedOwnerId = normalizeOwnerValue(await env.KV.get('github_owner_id'));
      if (storedOwnerId) {
        ownerId = storedOwnerId;
      }
    }

    if (!ownerUsername) {
      ownerUsername = normalizeOwnerValue(await env.KV.get('github_owner_username'));
    }
  }

  return {
    ownerId,
    ownerUsername
  };
}