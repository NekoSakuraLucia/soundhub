require("dotenv").config();
const {
    Client,
    GatewayIntentBits,
    Collection,
    REST
} = require("discord.js");

const { Routes } = require("discord-api-types/v10");
const { LavalinkManager } = require("lavalink-client");

const fs = require("node:fs");
const path = require("node:path");
const PlayerEvents = require("./nodeEvents/Player");
const NodesEvents = require("./nodeEvents/Nodes");

class Bot {
    constructor() {
        // Create a new client instance
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildVoiceStates,
                // GatewayIntentBits.MessageContent,
            ]
        });

        // Lavalink manager initialization
        this.client.lavalink = new LavalinkManager({
            nodes: [
                {
                    authorization: process.env.LAVALINK_PASSWORD,
                    host: process.env.LAVALINK_HOST,
                    port: parseInt(process.env.LAVALINK_PORT),
                    id: "Soundhub",
                }
            ],
            sendToShard: (guildId, payload) => this.client.guilds.cache.get(guildId)?.shard?.send(payload),
            autoSkip: true,
            client: {
                id: process.env.CLIENT_ID,
                username: "Soundhub",
            },
        });

        // Initialize commands collection
        this.commands = [];
        this.client.commands = new Collection();

        // Load slash commands
        this.loadCommands();

        // Event listeners
        this.setupEventListeners();
    }

    // Load all slash commands
    loadCommands() {
        const commandsPath = path.join(__dirname, "commands");
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            this.client.commands.set(command.data.name, command);
            this.commands.push(command.data.toJSON());
        }
    }

    // Set up event listeners
    setupEventListeners() {
        // Lavalink raw data handling
        this.client.on("raw", d => this.client.lavalink.sendRawData(d));

        // Ready event
        this.client.on("ready", () => {
            this.registerCommands();
            console.log(`Logged in as ${this.client.user.tag}!`);
            this.client.lavalink.init(this.client.user);
        });

        // Interaction event
        this.client.on("interactionCreate", async interaction => {
            if (!interaction.isCommand()) return;

            const command = this.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute({ client: this.client, interaction });
            } catch (err) {
                console.error("Error executing command:", err);
                await interaction.reply("❌ An error occurred while executing that command");
            }
        });

        // Player and Node event handling
        PlayerEvents(this.client);
        NodesEvents(this.client);
    }

    // Register the global slash commands
    async registerCommands() {
        const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
        try {
            await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: this.commands });
            console.log("Successfully registered global commands!");
        } catch (error) {
            console.error("Error registering commands:", error);
        }
    }

    // Log the bot in
    login() {
        this.client.login(process.env.DISCORD_TOKEN);
    }
}

// Create a new bot instance and log it in
const bot = new Bot();
bot.login();
