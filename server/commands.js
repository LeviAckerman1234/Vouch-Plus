const Sentry = require("@sentry/node");
const {MessageEmbed} = require('discord.js');

const lib = require('./lib');
const database = require('./database');
const config = require('./config');

exports.setup_profile = function (msg) {
	database.createUserProfile(msg.author.id, function (err) {
		if (err) {
			if (err === "ERR_PROFILE_ALREADY_CREATED") return msg.reply('Your profile has already been created. Run +profile to view your profile.')

			console.error(err);
			Sentry.captureException(err);
			return msg.reply('There was an unknown error. Please try again later.');
		}

		msg.reply('Your profile has successfully been created.');
	})
}

const get_target = function (msg, args) {
	if (args.length > 0) { // Handle arguments
		let first_arg = args[0];

		first_arg = first_arg.replace(/[<@!>]/g, '');

		if (!lib.isNumber(first_arg)) { // If discord ID is not valid
			return -1;
		} else {
			return first_arg;
		}
	} else {
		return msg.author.id;
	}
}

const generate_vouches = function (vouch_objects, client, callback) {
	let count = 0;
	let vouches = [];

	if (vouch_objects.length > 0) {
		vouch_objects.forEach((result, index) => {
			let message = result.message;
			if (message.length > 30) message = message.slice(0, 30) + "...";

			const icon = (result.positive) ? ":arrow_up:" : ":arrow_down:";

			// Convert id of user that sent in reputation to tag
			lib.idToTag(result.from_id, client, function (err, tag) {
				const human_index = index + 1;
				const date = lib.dateToString(result.date);

				vouches[index] = `${human_index}) ${icon} ${tag} ${message} | ${date}`

				count++;

				if (count === vouch_objects.length) {
					return callback(vouches);
				}
			})
		})
	} else {
		return callback(["No vouches yet..."]);
	}
}

exports.profile = function (msg, args, client) {
	// Get the ID that command is targeting (self or other user)
	id = get_target(msg, args);

	if (id === -1) return msg.reply("user does not have a profile on Vouch Plus.");

	// Get user profile from database
	database.getUserProfile(id, function (err, profile) {
			if (err) {
				if (err === "ERR_NO_USER_FOUND") {
					if (id === msg.author.id) {
						return msg.reply("you do not have a profile on Vouch Plus. Please run +help for help.");
					} else {
						return msg.reply("user does not have a profile on Vouch Plus.");
					}
				}

				console.error(err);
				Sentry.captureException(err);
				return msg.reply('There was an unknown error. Please try again later.');
			}

			// Get reputation sum
			const positive_rep = profile.vouches.filter(e => e.positive === true).length;
			const negative_rep = profile.vouches.filter(e => e.positive === false).length;
			const reputation_sum = positive_rep - negative_rep;

			let vouch_objects = profile.vouches.reverse().slice(0, 5);
			generate_vouches(vouch_objects, client, function (vouches) {
				let vouch_text = "";

				vouches.forEach(vouch => {
					vouch_text += vouch + "\n"
				})

				const remaining_vouches = profile.vouches.length - vouches.length;

				if (remaining_vouches > 0) vouch_text += `*+ ${remaining_vouches} more*`

				lib.idToTag(id, client, function (err, tag) {
					const embed = new MessageEmbed()
						.setColor(config.EMBED_COLOR)
						.setTitle(`Viewing profile of ${tag}`)
						.addField("Reputation", `${reputation_sum} (${positive_rep} positive, ${negative_rep} negative)`, true)
						.addField("DWC", profile.dwc, true)
						.addField("Vouches", vouch_text, false)
						.setFooter("Bot created by cryptographic#1337. DM me for your own coding project you need made!");

					msg.channel.send(embed);
				})
			});
		})
}

exports.rep = function (msg, args, type) {
	const positive = type === "+";

	if (args.length < 2) return msg.reply('invalid format. Run +help for help.')

	// Remove <@ > from tag
	let id = args[0].replace(/[<@!>]/g, '');

	// Make sure discord ID is valid
	if (!lib.isNumber(id)) return msg.reply('user does not have a profile on Vouch Plus.');

	if (id === msg.author.id) return msg.reply('you can\'t rep yourself.');

	let message = args.slice(1).join(' ');

	if (message.length > 300) return msg.reply('message is too long. Maximum of 300 characters allowed.');

	database.addRep(id, msg.author.id, positive, message, function (err) {
		if (err) {
			if (err === "ERR_NO_USER_FOUND") return msg.reply('user does not have a profile on Vouch Plus.');

			console.error(err);
			Sentry.captureException(err);
			return msg.reply('There was an unknown error. Please try again later.');
		}

		msg.reply("success! Reputation added.");
	})
}

exports.vouches = function (msg, args, client) {
	if (args.length !== 1 && args.length !== 2) return msg.reply('invalid format. Run +help for help.');

	// Remove <@ > from tag
	let id = args[0].replace(/[<@!>]/g, '');
	if (!lib.isNumber(id)) return msg.reply('user does not have a profile on Vouch Plus.');

	let page = args[1];
	if (!page) page = 1;
	if (!lib.isNumber(page) || page < 1) return msg.reply('please enter a valid page number.');

	database.getUserVouches(id, function (err, user_vouches) {
		if (err) {

			if (err === "ERR_NO_USER_FOUND") return msg.reply('user does not have a profile on Vouch Plus.');

			console.error(err);
			Sentry.captureException(err);
			return msg.reply('There was an unknown error. Please try again later.');
		}

		page--;

		if (page * 5 > user_vouches.length && page > 1) {
			return msg.reply('page number is too high.');
		}

		let vouch_objects = user_vouches.reverse().slice(page * 5, page * 5 + 5);
		generate_vouches(vouch_objects, client, function (vouches) {
			let vouch_text = "";

			vouches.forEach(vouch => {
				vouch_text += vouch + "\n"
			})

			lib.idToTag(id, client, function (err, tag) {
				const embed = new MessageEmbed()
					.setColor(config.EMBED_COLOR)
					.setTitle(`Viewing page ${page + 1} of ${tag} vouches`)
					.addField("Vouches", vouch_text)
					.setFooter("Bot created by cryptographic#1337. DM me for your own coding project you need made!");

				msg.channel.send(embed);
			});
		})
	})
}

exports.help = function (msg) {
	msg.react("✅");

	let description = "";
	description += "`+profile` - View your own profile\n";
	description += "`+profile [user tag or id]` - View another user's profile\n";
	description += "`+profile setup` - Setup your profile\n";
	description += "`+rep [user tag] [message]` - Leave a positive reputation on a user's profile\n";
	description += "`-rep [user tag] [message]` - Leave a negative reputation on a user's profile\n";
	description += "`+vouches [user tag] (page number)` - View a list of a user's vouches\n";
	description += "\n";
	description += "`+help` - View this message\n";
	description += "`+ping` - View this bot's latency";

	const embed = new MessageEmbed()
		.setColor(config.EMBED_COLOR)
		.setTitle("Help")
		.setDescription(description)
		.setFooter("Bot created by cryptographic#1337. DM me for your own coding project you need made!");

	msg.author.send(embed);
}

exports.ping = function (msg) {
	const timeTaken = Date.now() - msg.createdTimestamp;
	msg.channel.send(`Pong! This message had a latency of ${timeTaken}ms.`);
}