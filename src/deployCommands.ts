import {REST, Routes} from 'discord.js';
import {getConfig} from './config';
import fs from 'node:fs';
import { pathToFileURL } from "node:url";
import path from 'node:path';

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(foldersPath).filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(foldersPath, file);
    const module = await import(pathToFileURL(filePath).href);
    const command = module.default ?? module;

    if (!command.data || !command.execute) {
        console.warn(
            `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
        );
        continue;
    }
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Construct and prepare an instance of the REST module
const {token, clientId} = getConfig();
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(Routes.applicationCommands(clientId), { body: commands });

        // @ts-ignore
        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
})();