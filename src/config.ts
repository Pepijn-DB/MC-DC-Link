import dotenv from "dotenv";
import type { config } from "../lib/config";
import { ConfigurationError } from "../lib/config";
dotenv.config();

let current: config = { token: "", luckpermsUrl: "", ownerId: "", clientId: "", databaseUrl: "" };
let cached: Readonly<config> | undefined;

function setConfig(next: config): void {
	current = next;
	cached = undefined;
}

function initEnv(): void {
	if (process.env.DISCORD_TOKEN == undefined) {
		throw new ConfigurationError("Discord token is missing!");
	} else if (process.env.LUCKPERMS_URL == undefined) {
		throw new ConfigurationError("LuckPerms URL is missing!");
	} else if (process.env.OWNER_ID == undefined) {
		throw new ConfigurationError("Owner ID is missing!");
	} else if (process.env.CLIENT_ID == undefined) {
		throw new ConfigurationError("Client ID is missing!");
	}
	setConfig({
		token: process.env.DISCORD_TOKEN,
		luckpermsUrl: process.env.LUCKPERMS_URL,
		ownerId: process.env.OWNER_ID,
		clientId: process.env.CLIENT_ID,
		databaseUrl:
			process.env.DATABASE_URL ??
			"postgresql://postgres:postgres@localhost:5432/mc_link?schema=public",
	});
}

export function getConfig(): Readonly<config> {
	return (cached ??= Object.freeze({ ...current }));
}

initEnv();

export default getConfig;