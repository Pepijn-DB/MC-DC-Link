
import {
    InteractionContextType,
    MessageFlags,
    SlashCommandBuilder,
    type ChatInputCommandInteraction, Colors,
} from "discord.js";
import getConfig from "../config";
import {generateEmbed} from "../embed.ts";
import {prisma} from "../../lib/db.ts";

export const data = new SlashCommandBuilder()
    .setName("create-whitelist-embed")
    .setDescription("Manages the whitelist embed.")
    .setContexts(InteractionContextType.Guild);

export async function execute(
    interaction: ChatInputCommandInteraction,
): Promise<void> {
    if (interaction.user.id !== getConfig().ownerId) {
        await interaction.reply({
            content: "Je mag dit commando niet gebruiken teringlijer.",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    await interaction.deferReply({
        flags: MessageFlags.Ephemeral,
    });


    const channel = interaction.channel;

    if (!channel || !channel.isSendable()) {
        await interaction.editReply({
            content: "Could not find a channel where I can send the embed.",
        });
        return;
    }

    if (!interaction.guildId) {
        await interaction.editReply({
            content: "This command can only be used in a guild.",
        });
        return;
    }

    if (await prisma.guild.findUnique({ where: { discordId: interaction.guildId } })) {
        await interaction.editReply({
            content: "A whitelist embed already exists for this guild.",
        });
        return;
    }

    const embedMessage = await channel.send({ embeds: [await generateEmbed(interaction)] });

    await interaction.editReply({
        content: "Whitelist embed created successfully.",
    });

    if(!interaction.guildId) {
        console.error("Interaction is not in a guild.");
        return;
    }

    prisma.guild.create({
        data: {
            discordId: interaction.guildId,
            channelId: channel.id,
            embedId: embedMessage.id,
        },
    }).catch((error) => {
        console.error("Failed to create guild channel ID:", error);
    });
}
