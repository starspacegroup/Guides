export interface SetupStateStore {
	get(key: string): Promise<string | null>;
}

export interface SetupState {
	hasConfig: boolean;
	hasOwnerId: boolean;
	hasOwnerUsername: boolean;
	locked: boolean;
	complete: boolean;
}

/**
 * Reads first-run setup state.
 *
 * `complete` deliberately requires the whole owner configuration, not any one key. The setup POST
 * writes three KV entries and cannot do so atomically, so a failure part way through leaves an
 * installation nobody can log into. Treating a single key as proof of setup locked that
 * installation out of its own repair path: /setup redirected away, and the POST demanded an owner
 * that was never stored. An admin login is separate proof and locks setup on its own.
 */
export async function readSetupState(kv: SetupStateStore): Promise<SetupState> {
	const [config, ownerId, ownerUsername, adminFirstLogin] = await Promise.all([
		kv.get('auth_config:github'),
		kv.get('github_owner_id'),
		kv.get('github_owner_username'),
		kv.get('admin_first_login_completed')
	]);

	const hasConfig = Boolean(config);
	const hasOwnerId = Boolean(ownerId);
	const hasOwnerUsername = Boolean(ownerUsername);
	const locked = Boolean(adminFirstLogin);

	return {
		hasConfig,
		hasOwnerId,
		hasOwnerUsername,
		locked,
		complete: locked || (hasConfig && hasOwnerId && hasOwnerUsername)
	};
}
