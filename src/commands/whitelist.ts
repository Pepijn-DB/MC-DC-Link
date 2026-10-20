import {
    MessageFlags,
    SlashCommandBuilder,
    type ChatInputCommandInteraction, InteractionContextType,
} from "discord.js";
import {
    addUserToGroup,
    checkIfUserExists,
    createUserByUsername,
    getUserFromUsername,
    getUsersOnWhitelist
} from "../../lib/luckpermsHttp.ts";
import getConfig from "../config.ts";
import {generateEmbed} from "../embed.ts";
import {prisma} from "../../lib/db.ts";
import {isValidMinecraftUsername} from "../../lib/minecraftHttp.ts";

export const data = new SlashCommandBuilder()
    .setName("whitelist")
    .setDescription("Manage the Minecraft whitelist.")
    .setContexts(InteractionContextType.Guild)
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
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName("embed")
            .setDescription("Create the whitelist embed in this channel")
    )

export async function execute(
    interaction: ChatInputCommandInteraction,
): Promise<void> {
    switch (interaction.options.getSubcommand()) {
        case "add":
            await addUser(interaction); break;
        case "embed":
            await createEmbed(interaction); break;

    }
}

async function addUser(interaction: ChatInputCommandInteraction): Promise<void> {
    const username = interaction.options.getString("username", true);

    await interaction.deferReply();

    if (!(await isValidMinecraftUsername(username)))
        await interaction.editReply({
            content: `User ${username} is not a valid username`
        });
    
    await getUsersOnWhitelist().then((users) => {
        if (users.some((user) => user.username?.toLowerCase() === username.toLowerCase())) {
            interaction.editReply({
                content: `User ${username} is already on the whitelist.`,
            });
            return;
        }
    });

    await interaction.editReply({
        content: `Adding ${username} to the whitelist...`,
    });

    const userIsInLuckPerms = await checkIfUserExists(username);
    if (!userIsInLuckPerms) {
        await interaction.editReply({
            content: `User ${username} has never joined the server before. Adding ${username} to the database...`,
        });
        const isCreated = await createUserByUsername(username);
        if (!isCreated) {
            await interaction.editReply({
                content: `Failed to add ${username} to the database. Please try again later.`,
            });
            return;
        }
        await interaction.editReply({
            content: `Successfully added ${username} to the database.`,
        });
    }

    await interaction.editReply({
        content: `Adding ${username} to the whitelist...`,
    });

    const insertedUser = await getUserFromUsername(username);
    if (!insertedUser) {
        await interaction.editReply({
            content: `Failed to retrieve ${username} from the database. Please try again later.`,
        });
        return;
    }

    const userHasBeenAdded = await addUserToGroup(insertedUser.uniqueId, "forever-access");
    if (!userHasBeenAdded) {
        await interaction.editReply({
            content: `Failed to add ${username} to the whitelist. Please try again later.`,
        });
        return;
    }

    await interaction.editReply({
        content: `Successfully added ${username} to the whitelist.`,
    });


    return;
}

async function createEmbed(interaction: ChatInputCommandInteraction): Promise<void> {
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

    const embedMessage = await channel.send({
        embeds: [await generateEmbed(interaction)],
        allowedMentions: {
            users: [],
        },
    });

    await interaction.editReply({
        content: "Whitelist embed created successfully.",
    });

    if(!interaction.guildId) {
        console.error("Interaction is not in a guild.");
        return;
    }

    await prisma.guild.create({
        data: {
            discordId: interaction.guildId,
            channelId: channel.id,
            embedId: embedMessage.id,
        },
    }).catch((error: Error) => {
        console.error("Failed to create guild channel ID:", error);
    });
}
