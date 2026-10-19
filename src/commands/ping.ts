import {
    MessageFlags,
    SlashCommandBuilder,
    type ChatInputCommandInteraction,
} from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with a pong.");

export async function execute(
    interaction: ChatInputCommandInteraction,
): Promise<void> {
    await interaction.deferReply({
        flags: MessageFlags.Ephemeral,
    });

    const latency = Date.now() - interaction.createdTimestamp;

    await interaction.editReply(
        `Roundtrip latency: ${latency}ms`,
    );
}
