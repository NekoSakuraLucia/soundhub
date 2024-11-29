const { SlashCommandBuilder } = require("discord.js");
const {
    joinVoiceChannelEmbed,
    botNotConnectedEmbed,
    sameVoiceChannelEmbed,
    noSongPlayingEmbed,
    pausedPlayingEmbed,
    pauseErrorEmbed,
    alreadyPausedEmbed,
    processingErrorEmbed
} = require("../../utils/embeds/index")

async function pauseTrack({ client, interaction }) {
    try {
        if (!interaction.guildId) return;

        await interaction.deferReply({ephemeral:true});

        const voiceChannel = interaction.member.voice.channelId;

        if (!voiceChannel) {
            const embed = joinVoiceChannelEmbed()
            return interaction.editReply({embeds: [embed]});
        }

        const player = client.lavalink.getPlayer(interaction.guildId);

        if (!player) {
            const embed = botNotConnectedEmbed()
            return interaction.editReply({embeds:[embed]});
        }

        if (player.voiceChannelId !== voiceChannel) {
            const embed = sameVoiceChannelEmbed()
            return interaction.editReply({embeds:[embed]});
        }

        if (!player.queue.current) {
            const embed = noSongPlayingEmbed()
            return interaction.editReply({embeds:[embed]});
        }

        if (!player.paused) {
            try {
                await player.pause();
                const embed = pausedPlayingEmbed()
                await interaction.editReply({embeds:[embed]});
            } catch (error) {
                console.error(error);
                const embed = pauseErrorEmbed()
                await interaction.editReply({embeds:[embed]});
            }
        } else {
            const embed = alreadyPausedEmbed()
            await interaction.editReply({embeds:[embed]});
        }
    } catch (error) {
        console.error(error);
        const embed = processingErrorEmbed()
        return interaction.editReply({embeds:[embed]});
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pause")
        .setDescription("Pause the currently playing song."),
    execute: pauseTrack,
    pauseTrack, // Export the function
};
