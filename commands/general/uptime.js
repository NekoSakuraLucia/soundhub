const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Shows how long the bot has been online'),
    async execute({ client, interaction }) {
        const uptime = client.uptime;
        const days = Math.floor(uptime / (24 * 60 * 60 * 1000));
        const hours = Math.floor((uptime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((uptime % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((uptime % (60 * 1000)) / 1000);

        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('Bot Uptime ⏱️')
            .setDescription(`The bot has been online for ${days}d ${hours}h ${minutes}m ${seconds}s`)
            .setFooter({ text: 'Uptime Info', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};