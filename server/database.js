const mongoose = require('mongoose');

const config = require('./config');

const User = require('./schemas/UserSchema');
const Vouch = require('./schemas/VouchSchema');

// Connect to database
mongoose.connect(config.DB_URL, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useFindAndModify: false,
	useCreateIndex: true
})

// Create connection
mongoose.connection.on('error', function (err) {
	console.error(err)
})

exports.createUserProfile = function (id, callback) {
	User.create({
		id: id
	}, function (err) {
		if (err) return callback(err);

		callback(null);
	})
}

exports.getUserProfile = function (id, callback) {
	User.findOne({id: id}, function (err, user) {
		if (err) return callback(err);
		if (!user) return callback("ERR_NO_USER_FOUND");

		Vouch.find({to_id: id}, function (err, vouches) {
			if (err) return callback(err);

			user.vouches = vouches;

			callback(null, user);
		})
	})
}

exports.addRep = function (to_id, from_id, positive, msg, callback) {
	User.findOne({id: to_id}, function (err, user) {
		if (err) return callback(err);
		if (!user) return callback("ERR_NO_USER_FOUND");

		Vouch.create({
			to_id: to_id,
			from_id: from_id,
			positive: positive,
			message: msg,
			date: new Date()
		}, function (err) {
			if (err) return callback(err);

			callback(null);
		})
	})
}

exports.getUserVouches = function (id, callback) {
	User.findOne({id: id}, function (err, user) {
		if (err) return callback(err);
		if (!user) return callback("ERR_NO_USER_FOUND");

		Vouch.find({to_id: id}, function (err, vouches) {
			if (err) return callback(err);

			callback(null, vouches);
		})
	})
}