require('dotenv').config();

module.exports = {
	"NODE_ENV": process.env.NODE_ENV,
	"BOT_TOKEN": process.env.BOT_TOKEN,
	"SENTRY_DSN": process.env.SENTRY_DSN,
	"DB_URL": process.env.DB_URL
}