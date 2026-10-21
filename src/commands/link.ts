import {
    MessageFlags,
    SlashCommandBuilder,
    type ChatInputCommandInteraction, InteractionContextType,
} from "discord.js";
import {
    addNodeToUser,
    getUserFromUsername, getUserFromUuid,
} from "../../lib/luckpermsHttp.ts";
import {prisma} from "../../lib/db.ts";
import {getMinecraftProfiles, isValidMinecraftUsername} from "../../lib/minecraftHttp.ts";

export const data = new SlashCommandBuilder()
    .setName("link")
    .setDescription("Link your minecraft account to the server.")
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
        option
            .setName("username")
            .setDescription("The Minecraft username to link.")
            .setRequired(true)
    )
    .addStringOption((option) =>
        option
            .setName("code")
            .setDescription("The verification code.")
            .setRequired(true)
    )

export async function execute(
    interaction: ChatInputCommandInteraction,
): Promise<void> {
    const username = interaction.options.getString("username", true);
    const verificationCode = interaction.options.getString("code", true);



    if (!await isValidMinecraftUsername(username)) {
        await interaction.reply({
            content: "Invalid Minecraft username.",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const userFromUsername = await getUserFromUsername(username);
    if (!userFromUsername) {
        await interaction.reply({
            content: "User not found.",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const user = await getUserFromUuid(userFromUsername.uniqueId);
    if (!user) {
        await interaction.reply({
            content: "User not found.",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    for (const node of user.nodes.filter(f => f.key.includes("meta.discord_verification_code"))) {
        if (node.key.includes(verificationCode)) {
            if (await addNodeToUser(user.uniqueId, {key: `meta.discord_account.${interaction.user.id}`, value: true})) {
                if (!user.username) continue;

                await interaction.reply({
                    content: "Account linked successfully.",
                    flags: MessageFlags.Ephemeral,
                });

                await getMinecraftProfiles([user.username]).then(async (profiles) => {
                    const profile = profiles[0];
                    if (!profile) return;
                    await prisma.minecraftUser.upsert({
                        create: {
                            uuid: user.uniqueId,
                            lowercaseName: username.toLowerCase(),
                            normalizedName: profile.name || username,
                            discordid: interaction.user.id
                        },
                        update: {
                            discordid: interaction.user.id
                        },
                        where: {uuid: user.uniqueId}
                    });
                });
            } else {
                await interaction.reply({
                    content: "Failed to link account.",
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
    }

    await interaction.reply({
        content: "Invalid verification code or account.",
        flags: MessageFlags.Ephemeral,
    })
}
