const Discord = require('discord.js');
const Sentry = require("@sentry/node");

const config = require('./config');
const commands = require('./commands');

const production = config.NODE_ENV === "production";

if (production) Sentry.init({dsn: config.SENTRY_DSN});

const client = new Discord.Client();

client.on('ready', () => {
	console.log("Discord bot ready");

	client.user.setPresence({
		status: "online",
		game: {
			name: "+help for help",
			type: "PLAYING"
		}
	})
})

// Handle message
client.on("message", function (msg) {
	if (msg.author.bot) return;
	if (!msg.content.startsWith("+") && !msg.content.startsWith("-")) return;

	// Remove prefix from message content
	const commandRaw = msg.content.slice(1);

	// Split message content into parts
	const args = commandRaw.split(' ');

	// Strip command from args
	const command = args.shift().toLowerCase();

	/******* Handle Commands *******/
	// Reputation commands
	if (command === "p" || command === "profile") {
		if (args[0] === "setup") return commands.setup_profile(msg);
		return commands.profile(msg, args, client);
	}
	if (command === "rep") return commands.rep(msg, args, msg.content.slice(0, 1));
	if (command === "vouches" || command === "v") return commands.vouches(msg, args, client);
	if (command === "leaderboard" || command === "l") return commands.leaderboard(msg, client);

	// System commands
	if (command === "h" || command === "help") return commands.help(msg);
	if (command === "ping") return commands.ping(msg);
})

// Login to bot
client.login(config.BOT_TOKEN);