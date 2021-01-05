const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
	id: {type: String, unique: true},
	dwc: {type: Boolean, default: false}
})

module.exports = mongoose.model('User', userSchema);