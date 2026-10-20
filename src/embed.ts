import {
    Colors,
    EmbedBuilder,
    type Interaction,
    type Message,
    type TextChannel
} from "discord.js";
import {prisma} from "../lib/db.ts";
import {client} from "./index.ts";
import {getUsersFromGroup, getUsersOnWhitelist} from "../lib/luckpermsHttp.ts";
import type {MinecraftProfile} from "../lib/types/minecraft.ts";
import type {LuckPermsUser} from "../lib/types/luckperms.ts";
import {getMinecraftProfilesBatch} from "../lib/minecraftHttp.ts";
import type {MinecraftUser} from "./generated/prisma/client.ts";

export async function updateEmbed(interaction: Interaction): Promise<void> {
    if (!interaction.guildId) throw new Error("Interaction is not in a guild.");


    const guild = await prisma.guild.findUnique({
        where: {
            discordId: interaction.guildId,
        },
    });

    if (!guild) {
        await (client.channels.cache.get(interaction.channelId) as TextChannel)
            .send({
                embeds: [await generateEmbed(interaction)],
                allowedMentions: {
                    users: [],
                },
            });

        await prisma.guild.create({
            data: {
                discordId: interaction.guildId,
                channelId: interaction.channelId,
            },
        });

        return;
    }


    if (!guild.channelId) throw new Error("Guild channel not found.");

    const channel = await client.channels.fetch(guild.channelId);
    if (!channel || !channel.isTextBased()) throw new Error("Channel not found or is not text-based.");

    channel.messages.fetch(guild.embedId).then(async (message: Message) => {
        if (!message) throw new Error("Message not found.");

        await message.edit({
            embeds: [await generateEmbed(interaction)],
            allowedMentions: {
                users: [],
            },
        })
    });
}


export async function generateEmbed(
    interaction: Interaction,
): Promise<EmbedBuilder> {
    const now: Date = new Date();

    const profilesWithStopPermission: Set<string> = new Set((await getMinecraftProfilesBatch(
        (await getUsersFromGroup("forever-stop-server")).map((user: LuckPermsUser) => user.uniqueId),
    )).map((user: MinecraftProfile) => user.name));

    const profilesOnWhitelist: MinecraftProfile[] = await getMinecraftProfilesBatch(
        (await getUsersOnWhitelist()).map((user: LuckPermsUser) => user.uniqueId),
    );
    const userListOnWhitelist: string = profilesOnWhitelist.length > 0
        ? profilesOnWhitelist.map((user: MinecraftProfile) => `${user.name}${profilesWithStopPermission.has(user.name) ? " :octagonal_sign:" : ""}`).join("\n")
        : "No users found.";

    const linkedDiscordAccounts:MinecraftUser[] = await prisma.minecraftUser.findMany({
        where: {
            uuid: { in: profilesOnWhitelist.map((user) => user.id) },
        },
        select: {
            uuid: true,
            id: true,
            lowercaseName: true,
            normalizedName: true,
            discordid: true
        },
    });

    for (const account of linkedDiscordAccounts) {
        const profile = profilesOnWhitelist.find((user) => user.id === account.uuid);
        if (profile) {
            userListOnWhitelist.replace(profile.name, `<@${account.discordid}> (${profile.name})${profilesWithStopPermission.has(profile.name) ? " :octagonal_sign:" : ""}`);
        }
    }


    return new EmbedBuilder()
        .setTitle("Whitelist")
        .addFields({
            name: "Whitelisted Users",
            value: userListOnWhitelist,
        })
        .addFields({
            name: "Note",
            value: ":octagonal_sign: Permission to stop/restart server.",
        })
        .setColor(Colors.Yellow)
        .setFooter({
            text: `Updated at ${now.toLocaleString("nl-NL")}`,
        });
}