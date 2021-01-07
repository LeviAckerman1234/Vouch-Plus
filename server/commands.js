const Sentry = require("@sentry/node");

const lib = require('./lib');
const database = require('./database');

exports.help = function (msg) {
	msg.react("✅");

	let message = "";
	message += "`=================[ Vouch Plus ]=================`\n";
	message += "\n";
	message += "`+profile` - View your own profile\n";
	message += "`+profile [user tag or id]` - View another user's profile\n";
	message += "`+profile setup` - Setup your profile\n";
	message += "`+rep [user tag] [message]` - Leave a positive reputation on a user's profile\n";
	message += "`-rep [user tag] [message]` - Leave a negative reputation on a user's profile\n";
	message += "`+vouches [user tag] (page number)` - View a list of a user's vouches\n";
	message += "\n";
	message += "`+help` - View this message\n";
	message += "`+ping` - View this bot's latency";

	msg.author.send(message);
}

const setup_profile = function (msg) {
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
exports.profile = function (msg, args, client) {
	let id;

	if (args.length > 0) { // Handle arguments
		let first_arg = args[0];

		if (first_arg === "setup") return setup_profile(msg);

		first_arg = first_arg.replace(/[<@!>]/g, '');

		if (!lib.isNumber(first_arg)) { // If discord ID is not valid (attempted db attack?)
			if (msg.mentions.users.first()?.id === first_arg) {
				return msg.reply('user does not have a profile on Vouch Plus.');
			} else {
				return msg.reply('please enter a valid discord id.');
			}
		} else {
			id = first_arg;
		}
	} else {
		id = msg.author.id;
	}

	// Send loading message
	msg.channel.send("Loading... Please wait.").then(loading_message => {
		database.getUserProfile(id, function (err, profile) {
			if (err) {
				// Delete loading message
				loading_message.delete()

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

			let message = "";
			message += "`=================[ Vouch Plus ]=================`\n";
			message += `Viewing profile of <@${id}>\n`;
			message += `Reputation ${reputation_sum} (${positive_rep} positive, ${negative_rep} negative)\n`;
			message += `DWC: \`${profile.dwc}\`\n`;
			message += '\n';
			message += '`........[ Vouches ]........`\n'

			const vouches = profile.vouches.slice(0, 5);

			let count = 0;

			let vouch_messages = [];
			vouches.forEach((result, index) => {
				let rep_msg = result.message;
				if (rep_msg.length > 30) rep_msg = rep_msg.slice(0, 30) + "...";

				const icon = (result.positive) ? "<:uparrow:795808477447716907>️" : "<:downarrow:795809362584404029>";

				// Convert id of user that sent in reputation to tag
				lib.idToTag(result.from_id, client, function (err, tag) {
					vouch_messages.push({
						index: index,
						message: `${index + 1}) ${icon} ${tag} ${rep_msg} | ${lib.dateToString(result.date)} \n`
					});

					fetch_callback();
				})
			})

			if (vouches.length === 0) {
				message += 'No vouches yet...\n';
				fetch_callback();
			}

			function fetch_callback() {
				count++;

				if (count === vouches.length || vouches.length === 0) {
					vouch_messages.sort((a, b) => a.index - b.index).forEach(result => {
						message += result.message
					})

					message += '\n';
					message += 'Bot created by cryptographic#1337'

					loading_message.edit(message);
				}
			}
		})
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

exports.vouches = function (msg, args) {
	if (args === 0 || args > 2) return msg.reply('invalid format. Run +help for help.');

	// Remove <@ > from tag
	let id = args[0].replace(/[<@!>]/g, '');
	if (!lib.isNumber(id)) return msg.reply('user does not have a profile on Vouch Plus.');

	let page = args[1];
	if (!page) page = 1;
	if (!lib.isNumber(page) || page < 1) return msg.reply('please enter a valid page number.');

	msg.channel.send("Loading... Please wait.").then(loading_message => {
		database.getUserVouches(id, function (err, vouches) {
			if (err) {
				loading_message.delete()

				if (err === "ERR_NO_USER_FOUND") return msg.reply('user does not have a profile on Vouch Plus.');

				console.error(err);
				Sentry.captureException(err);
				return msg.reply('There was an unknown error. Please try again later.');
			}

			if (page * 5 > vouches.length && page > 1) {
				loading_message.delete()

				return msg.reply('page number is too high.');
			}

			let message = "";
			message += "`=================[ Vouch Plus ]=================`\n";
			message += `Viewing vouches of <@${id}>\n`;
			message += `Page ${page}\n`;
			message += "\n";
			message += '`........[ Vouches ]........`\n';

			let count = 0;
			let vouch_messages = [];

			vouches = vouches.slice(page * 5, page * 5 + 5);
			vouches.forEach(result => {
				let rep_msg = result.message;
				if (rep_msg.length > 30) rep_msg = rep_msg.slice(0, 30) + "...";

				const icon = (result.positive) ? "<:uparrow:795808477447716907>️" : "<:downarrow:795809362584404029>";

				// Convert id of user that sent in reputation to tag
				lib.idToTag(result.from_id, client, function (err, tag) {
					vouch_messages.push({
						index: index,
						message: `${index + 1}) ${icon} ${tag} ${rep_msg} | ${lib.dateToString(result.date)} \n`
					});

					fetch_callback();
				})
			})

			if (vouches.length === 0) {
				message += 'No vouches yet...\n';
				fetch_callback();
			}

			function fetch_callback() {
				count++;

				if (count === vouches.length || vouches.length === 0) {
					vouch_messages.sort((a, b) => a.index - b.index).forEach(result => {
						message += result.message
					})

					message += '\n';
					message += 'Bot created by cryptographic#1337'

					loading_message.edit(message);
				}
			}
		})
	})
}

exports.ping = function (msg) {
	const timeTaken = Date.now() - msg.createdTimestamp;
	msg.channel.send(`Pong! This message had a latency of ${timeTaken}ms.`);
}