import {
    MessageFlags,
    SlashCommandBuilder,
    type ChatInputCommandInteraction,
} from "discord.js";
import {
    addUserToGroup,
    checkIfUserExists,
    createUserByUsername,
    getUserFromUsername,
    getUsersOnWhitelist
} from "../../lib/luckpermsHttp.ts";

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
    }
}