const mongoose = require('mongoose');
const {v4: uuid} = require('uuid');

const Schema = mongoose.Schema;

const schema = new Schema({
	id: String,
	to_id: String,
	from_id: String,
	positive: Boolean,
	message: String,
	date: Date
})

schema.pre("save", function (next) {
	this.id = uuid()
	next();
})

module.exports = mongoose.model('Vouches', schema);