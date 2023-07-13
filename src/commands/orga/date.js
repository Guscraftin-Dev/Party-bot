const { Collection, PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { Party } = require("../../dbObjects");
const { getValidDate } = require("../../functions");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("date")
        .setDescription("🎉〢 Pour changer la date de ta fête.")
        .setDMPermission(false)
        .addStringOption((option) =>
            option.setName("date-début")
                .setDescription("La date où ta fête commencera (DD/MM/AAAA).").setMinLength(10).setMaxLength(10).setRequired(true))
        .addStringOption((option) =>
            option.setName("date-fin")
                .setDescription("La date où ta fête finira (DD/MM/AAAA).").setMinLength(10).setMaxLength(10).setRequired(true)),

    async execute(interaction) {
        const dateStart = interaction.options.getString("date-début");
        const dateEnd = interaction.options.getString("date-fin");
        const channel = interaction.channel;

        // Check the exception of the command
        const party = await Party.findOne({ where: { category_id: channel.parentId } });
        if (!party || (party.organizer_id !== interaction.member.id && !interaction.member.permissions.has(PermissionFlagsBits.Administrator))) {
            return interaction.reply({
                content: "Tu dois être l'organisateur de cette fête (de cette catégorie) pour pouvoir gérer la date de la fête !" +
                "\nSi tu es organisateur et que tu veux gérer la date de tes fête, tape cette commande dans la catégorie de ta fête.",
                ephemeral: true,
            });
        }

        // Check if the date is valid
        const nameVocal = await getValidDate(dateStart, dateEnd, interaction);
        if (nameVocal === "") return;

        const vocalChannel = await interaction.guild.channels.fetch(party.channel_date_id);
        if (!vocalChannel || vocalChannel instanceof Collection) return interaction.reply({ content: "La récupération de la date a échoué.", ephemeral: true });

        await vocalChannel.setName(nameVocal).catch(error => {
            console.error(error);
            return interaction.reply({ content: "La modification de la date a échoué.", ephemeral: true });
        });

        return interaction.reply({ content: "Votre date a correctement été modifié.", ephemeral: true });
    },
};
