import { Collection, MessageFlags, type Interaction } from "discord.js";

const { Client, Events, GatewayIntentBits } = require("discord.js");
import getConfig from "./config.ts";
import { closeDatabase, initDatabase } from "../lib/db";
import * as path from "node:path";
import * as fs from "node:fs";
import {updateEmbed} from "./embed.ts";

export const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient: typeof Client) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});


client.on(Events.InteractionCreate, async (interaction: Interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);
	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		const content = "There was an error while executing this command!";
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
		} else {
			await interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}
	}
	try {
		await updateEmbed(interaction);
	} catch (error) {
		console.error("Failed to update embed:", error);
	}
});

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(foldersPath).filter((file) => file.endsWith('.ts') || file.endsWith('.js'));
for (const file of commandFiles) {
	const filePath = path.join(foldersPath, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

try {
	await initDatabase();
} catch (error) {
	console.error("Failed to connect to the database:", error);
	process.exit(1);
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
	process.on(signal, async () => {
		await closeDatabase();
		process.exit(0);
	});
}

client.login(getConfig().token);