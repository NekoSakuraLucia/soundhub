const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { QueryType } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Play songs or playlists from YouTube.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("search")
                .setDescription("Searches for a song and plays it.")
                .addStringOption(option =>
                    option
                        .setName("searchterms")
                        .setDescription("Search keywords.")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("playlist")
                .setDescription("Plays a playlist from YouTube.")
                .addStringOption(option =>
                    option
                        .setName("url")
                        .setDescription("The playlist URL.")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("song")
                .setDescription("Plays a single song from YouTube.")
                .addStringOption(option =>
                    option
                        .setName("url")
                        .setDescription("The song URL.")
                        .setRequired(true)
                )
        ),
    execute: async ({ client, interaction }) => {
        const voiceChannel = interaction.member.voice.channel;

        // Check if the user is in a voice channel
        if (!voiceChannel) {
            return interaction.reply({
                content: "You need to be in a voice channel to play music!",
                ephemeral: true
            });
        }

        // Check if the bot has permissions to join and speak in the voice channel
        const permissions = voiceChannel.permissionsFor(interaction.client.user);
        if (!permissions.has(PermissionsBitField.Flags.Connect) || !permissions.has(PermissionsBitField.Flags.Speak)) {
            return interaction.reply({
                content: "I need permission to join and speak in your voice channel!",
                ephemeral: true
            });
        }

        let queue;
        try {
            // Create or get the queue
            queue = await client.player.queues.create(interaction.guild);

            // Connect to the voice channel
            if (!queue.connection) {
                console.log(`Connecting to voice channel: ${voiceChannel.name}`);
                await queue.connect(voiceChannel);
            }
        } catch (error) {
            console.error("Error creating or connecting to the queue:", error);
            return interaction.reply({
                content: "Failed to join the voice channel. Please check my permissions.",
                ephemeral: true
            } );
        }

        const subcommand = interaction.options.getSubcommand();
        let embed = new EmbedBuilder();

        try {
            if (subcommand === "song") {
                const url = interaction.options.getString("url");
                console.log(`Searching for song: ${url}`);
                const result = await client.player.search(url, {
                    requestedBy: interaction.user,
                    searchEngine: QueryType.YOUTUBE_VIDEO,
                });

                // Add logging to inspect the result
                console.log("Search result data:", result._data);

                if (!result || result.tracks.length === 0) {
                    return interaction.reply({
                        content: "No results found for the provided URL.",
                        ephemeral: true
                    });
                }

                const song = result.tracks[0];
                console.log(`Adding song: ${song.title} to queue`);
                await queue.addTrack(song);

                embed
                    .setDescription(`🎵 Added **[${song.title}](${song.url})** to the queue.`)
                    .setThumbnail(song.thumbnail || null)
                    .setFooter({ text: `Duration: ${song.duration || "Unknown"}` });
            } else if (subcommand === "playlist") {
                const url = interaction.options.getString("url");
                console.log(`Searching for playlist: ${url}`);
                const result = await client.player.search(url, {
                    requestedBy: interaction.user,
                    searchEngine: QueryType.YOUTUBE_PLAYLIST,
                });

                if (!result || result.tracks.length === 0) {
                    return interaction.reply({
                        content: "No playlist found for the provided URL.",
                        ephemeral: true
                    });
                }

                const playlist = result.playlist;
                console.log(`Adding playlist: ${playlist.title} to queue`);
                await queue.addTracks(result.tracks);

                embed
                    .setDescription(`🎶 Added **[${playlist.title}](${playlist.url})** (${result.tracks.length} tracks) to the queue.`)
                    .setThumbnail(playlist.thumbnail || null);
            } else if (subcommand === "search") {
                const searchterms = interaction.options.getString("searchterms");

                // Specific search terms, try using something well-known
                const refinedSearch = searchterms || "Never Gonna Give You Up Rick Astley"; // Example refined search
                console.log(`Searching for song: ${refinedSearch}`);
                const result = await client.player.search(refinedSearch, {
                    requestedBy: interaction.user,
                    searchEngine: QueryType.AUTO,
                });

                // Add logging to inspect the result
                console.log("Search result data:", result._data);

                if (!result || result.tracks.length === 0) {
                    return interaction.reply({
                        content: "No results found for your search terms.",
                        ephemeral: true
                    });
                }

                const song = result.tracks[0];
                console.log(`Adding song: ${song.title} to queue`);
                await queue.addTrack(song);

                embed
                    .setDescription(`🔍 Added **[${song.title}](${song.url})** to the queue.`)
                    .setThumbnail(song.thumbnail || null)
                    .setFooter({ text: `Duration: ${song.duration || "Unknown"}` });
            }

            // Play the queue if not already playing
            if (!queue.playing) {
                console.log("Playing music");
                await queue.play();
            }

            // Send the embed to the user
            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error("Error processing subcommand:", error);
            await interaction.reply({
                content: "An error occurred while processing your request. Please try again.",
                ephemeral: true
            });
        }
    },
};
