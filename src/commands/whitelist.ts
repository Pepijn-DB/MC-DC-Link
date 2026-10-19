import {
    MessageFlags,
    SlashCommandBuilder,
    type ChatInputCommandInteraction,
} from "discord.js";
import {checkIfUserExists} from "../../lib/luckpermsHttp.ts";

export const data = new SlashCommandBuilder()
    .setName("whitelist")
    .setDescription("Manage the Minecraft whitelist.")
    .addSubcommand((subcommand) =>
        subcommand
            .setName("add")
            .setDescription("Add a player to the whitelist.")
            .addStringOption((option) =>
                option
                    .setName("username")
                    .setDescription("The Minecraft username to add.")
                    .setRequired(true),
            ),
    );

export async function execute(
    interaction: ChatInputCommandInteraction,
): Promise<void> {
    switch (interaction.options.getSubcommand()) {
        case "add": {
            const username = interaction.options.getString("username", true);

            await interaction.deferReply();

            await interaction.editReply({
                content: `Adding ${username} to the whitelist...`,
            });

            const userIsInLuckPerms = await checkIfUserExists(username);
            if (!userIsInLuckPerms) {
                await interaction.editReply({
                    content: `User ${username} has never joined the server before. Adding ${username} to the database.`,
                });

            }

            return;
        }
    }
}