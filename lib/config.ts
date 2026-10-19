export interface config {
	token: string;
	luckpermsUrl: string;
	ownerId: string;
	clientId: string;
	databaseUrl: string;
}

export class ConfigurationError extends Error {}
