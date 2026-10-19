import {type APIEmbed, Colors, EmbedBuilder, type Interaction, type Message} from "discord.js";
import {prisma} from "../lib/db.ts";
import {client} from "./index.ts";
import {getUsersFromGroup, getUsersOnWhitelist} from "../lib/luckpermsHttp.ts";
import type {MinecraftProfile} from "../lib/types/minecraft.ts";
import type {LuckPermsUser} from "../lib/types/luckperms.ts";
import {getMinecraftProfilesBatch} from "../lib/minecraftHttp.ts";

export async function updateEmbed(interaction: Interaction): Promise<void> {
    if (!interaction.guildId) {
        throw new Error("Interaction is not in a guild.");
    }

    const guild = await prisma.guild.findUnique({
        where: {
            discordId: interaction.guildId,
        },
    });

    if (!guild) {
        throw new Error("Guild not found.");
    }
    if (!guild.channelId) {
        throw new Error("Guild channel not found.");
    }

    const channel = await client.channels.fetch(guild.channelId);
    if (!channel || !channel.isTextBased()) {
        throw new Error("Channel not found or is not text-based.");
    }

    channel.messages.fetch(guild.embedId).then(async (message: Message) => {
        if (!message) {
            throw new Error("Message not found.");
        }

        await message.edit({
            embeds: [await generateEmbed(interaction)]
        })
    });
}


export async function generateEmbed(
    interaction: Interaction,
): Promise<EmbedBuilder> {
    const now: Date = new Date();

    const profilesWithStop: Set<string> = new Set((await getMinecraftProfilesBatch(
        (await getUsersFromGroup("forever-stop-server")).map((user: LuckPermsUser) => user.uniqueId),
    )).map((user: MinecraftProfile) => user.name));

    const profiles: MinecraftProfile[] = await getMinecraftProfilesBatch(
        (await getUsersOnWhitelist()).map((user: LuckPermsUser) => user.uniqueId),
    );
    const userList: string = profiles.length > 0
        ? profiles.map((user: MinecraftProfile) => `${user.name}${profilesWithStop.has(user.name) ? " :octagonal_sign:" : ""}`).join("\n")
        : "No users found.";




    return new EmbedBuilder()
        .setTitle("Whitelist")
        .addFields({
            name: "Whitelisted Users",
            value: userList,
        })
        .setColor(Colors.Yellow)
        .setFooter({
            text: `Updated at ${now.toLocaleString("nl-NL")}`,
        });
}