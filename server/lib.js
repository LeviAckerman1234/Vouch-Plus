exports.isNumber = function (id) {
	const regex = /^[0-9]*$/;

	return regex.test(id);
}

exports.dateToString = function (date) {
	return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
}

exports.idToTag = function (id, client, callback) {
	client.users.fetch(id).then(user => {
		callback(null, user.tag);
	}, err => {
		if (err.httpStatus === 404) return callback(null, id);

		callback(err);
	})
}