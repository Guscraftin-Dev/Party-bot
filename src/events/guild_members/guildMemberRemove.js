const { Collection, Events } = require("discord.js");
const { Party } = require("../../dbObjects");
const { adminMessageId, emojiNeutral } = require(process.env.CONST);

/**
 * If a member leave the server in the main server,
 * Send a message in all organizer channel
 */

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        if (member.guild.id !== process.env.GUILD_ID) return;

        // Send a message in the admin channel
        const adminChannel = await member.guild.channels.fetch(adminMessageId);
        if (adminChannel && !(adminChannel instanceof Collection)) {
            await adminChannel.send(`${member} (\`${member.displayName}\`) a **quitté** le serveur !`);
        }

        // Send a message in all organizer channel
        const allParty = await Party.findAll();
        await allParty.forEach(async function(party) {
            // If the member is the organizer of the party, delete the party
            if (party.organizer_id === member.id) return party.destroy();

            // If the member is a organizer of the party, remove him from the organizer list
            if (party.organizer_list_id.includes(member.id)) {
                try {
                    const listOrganizer = party.organizer_list_id;
                    const index = listOrganizer.indexOf(member.id);
                    if (index > -1) {
                        listOrganizer.splice(index, 1);
                        await party.update({ organizer_list_id: listOrganizer });
                    }
                } catch (error) {
                    console.log("guildMemberRemove orga - " + error);
                }
            }

            // If the member is a guest of the party, remove him from the guest list
            if (party.guest_list_id.includes(member.id)) {
                try {
                    const listGuest = party.guest_list_id;
                    const index = listGuest.indexOf(member.id);
                    if (index > -1) {
                        listGuest.splice(index, 1);
                        await party.update({ guest_list_id: listGuest });
                    }
                } catch (error) {
                    console.error("guildMemberRemove guest - " + error);
                }
            }

            // Send a message in main organizer channel
            const panelOrganizerChannel = await member.guild.channels.fetch(party.panel_organizer_id);
            if (panelOrganizerChannel && !(panelOrganizerChannel instanceof Collection)) {
                await panelOrganizerChannel.send(
                    `<${emojiNeutral}> **${member} (\`${member.displayName}\`) a quitté le serveur !**\n` +
                        "Il était peut-être un organisateur ou un invité de ta soirée.",
                );
            }
        });
    },
};
