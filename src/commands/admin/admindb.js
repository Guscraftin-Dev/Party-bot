const { ChannelType, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { Party } = require("../../dbObjects");

/**
 * Manage manually the database
 */

module.exports = {
    data: new SlashCommandBuilder()
        .setName("admindb")
        .setDescription("🚧〢Pour gérer la base de donnée des soirées.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
        .addSubcommand(subcommand =>
            subcommand.setName("add")
                .setDescription("🚧〢Pour ajouter une soirée à la db.")
                .addUserOption(option =>
                    option.setName("member").setDescription("L'organisateur principale de la soirée.").setRequired(true))
                .addChannelOption(option =>
                    option.setName("category").setDescription("La catégorie de la soirée.").addChannelTypes(ChannelType.GuildCategory).setRequired(true))
                .addChannelOption(option =>
                    option.setName("orga-panel").setDescription("Le panel pour l'organisateur principale.").addChannelTypes(ChannelType.GuildText).setRequired(true))
                .addChannelOption(option =>
                    option.setName("orga-only").setDescription("Le salon uniquement pour les organisateurs.").addChannelTypes(ChannelType.GuildText).setRequired(true))
                .addChannelOption(option =>
                    option.setName("sans-orga").setDescription("Le salon seulement pour les invités.").addChannelTypes(ChannelType.GuildText).setRequired(true))
                .addChannelOption(option =>
                    option.setName("date").setDescription("Le salon pour voir la date de la soirée.").addChannelTypes(ChannelType.GuildVoice).setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName("edit")
                .setDescription("🚧〢Pour modifier une soirée de la db.")
                .addChannelOption(option =>
                    option.setName("category").setDescription("La catégorie de la soirée.").addChannelTypes(ChannelType.GuildCategory).setRequired(true))
                .addUserOption(option =>
                    option.setName("member").setDescription("L'organisateur principale de la soirée."))
                .addChannelOption(option =>
                    option.setName("orga-panel").setDescription("Le panel pour l'organisateur principale.").addChannelTypes(ChannelType.GuildText))
                .addChannelOption(option =>
                    option.setName("orga-only").setDescription("Le salon uniquement pour les organisateurs.").addChannelTypes(ChannelType.GuildText))
                .addChannelOption(option =>
                    option.setName("sans-orga").setDescription("Le salon seulement pour les invités.").addChannelTypes(ChannelType.GuildText))
                .addChannelOption(option =>
                    option.setName("date").setDescription("Le salon pour voir la date de la soirée.").addChannelTypes(ChannelType.GuildVoice)))
        .addSubcommand(subcommand =>
            subcommand.setName("list")
                .setDescription("🚧〢Pour lister les soirées de la base de donnée."))
        .addSubcommand(subcommand =>
            subcommand.setName("remove")
                .setDescription("🚧〢Pour supprimer une soirée de la db.")
                .addChannelOption(option =>
                    option.setName("category").setDescription("La catégorie de la soirée.").addChannelTypes(ChannelType.GuildCategory).setRequired(true))
                .addBooleanOption(option =>
                    option.setName("confirm").setDescription("Es-tu sur de vouloir supprimer cette soirée ?").setRequired(true))),
    async execute(interaction) {
        const member = interaction.options.getMember("member");
        const category = interaction.options.getChannel("category");
        const panelOrga = interaction.options.getChannel("orga-panel");
        const orgaOnly = interaction.options.getChannel("orga-only");
        const sansOrga = interaction.options.getChannel("sans-orga");
        const date = interaction.options.getChannel("date");
        const confirm = interaction.options.getBoolean("confirm");


        switch (interaction.options.getSubcommand()) {
            /**
             * Add a new party to the database
             */
            case "add": {
                const partyExist = await Party.findOne({ where: { category_id: category.id } });
                if (partyExist) return interaction.reply({ content: "Cette soirée existe déjà dans la base de donnée !", ephemeral: true });

                try {
                    await Party.create({
                        category_id: category.id,
                        panel_organizer_id: panelOrga.id,
                        channel_organizer_only: orgaOnly.id,
                        channel_without_organizer: sansOrga.id,
                        channel_date_id: date.id,
                        organizer_id: member.id,
                    });
                    return interaction.reply({ content: "La soirée a bien été ajouté à la base de donnée !", ephemeral: true });
                } catch (error) {
                    console.error("adminparty add - " + error);
                    return interaction.reply({ content: "Une erreur est survenue lors de l'ajout de la soirée dans la base de donnée !", ephemeral: true });
                }
            }


            /**
             * Edit a party in the database
             */
            case "edit": {
                const party = await Party.findOne({ where: { category_id: category.id } });
                if (!party) return interaction.reply({ content: "Cette soirée n'existe pas dans la base de donnée !", ephemeral: true });

                try {
                    if (member) await party.update({ organizer_id: member.id });
                    if (panelOrga) await party.update({ panel_organizer_id: panelOrga.id });
                    if (orgaOnly) await party.update({ channel_organizer_only: orgaOnly.id });
                    if (sansOrga) await party.update({ channel_without_organizer: sansOrga.id });
                    if (date) await party.update({ channel_date_id: date.id });

                    return interaction.reply({ content: "La soirée a bien été modifié dans la base de donnée !", ephemeral: true });
                } catch (error) {
                    console.error("adminparty edit - " + error);
                    return interaction.reply({ content: "Une erreur est survenue lors de la modification de la soirée dans la base de donnée !", ephemeral: true });
                }
            }


            /**
             * List all parties in the database
             */
            case "list":
                // TODO: list all parties in the database
                await interaction.reply({ content: "🚧〢Commande en cours de développement !", ephemeral: true });
                break;


            /**
             * Remove a party in the database
             */
            case "remove": {
                if (!confirm) return interaction.reply({ content: "Tu dois confirmer la suppression de la soirée !", ephemeral: true });

                const party = await Party.findOne({ where: { category_id: category.id } });
                if (!party) return interaction.reply({ content: "Cette soirée n'existe pas dans la base de donnée !", ephemeral: true });

                try {
                    await party.destroy();
                    return interaction.reply({ content: "La soirée a bien été supprimé de la base de donnée !", ephemeral: true });
                } catch (error) {
                    console.error("adminparty remove - " + error);
                    return interaction.reply({ content: "Une erreur est survenue lors de la suppression de la soirée !", ephemeral: true });
                }
            }

            default:
                return interaction.reply("Erreur lors de l'exécution de la commande !");
        }
    },
};
