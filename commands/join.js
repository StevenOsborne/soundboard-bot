require('log-timestamp');
module.exports = {
	name: 'join',
    description: 'joined ',
    args: false,
	execute(message, args) {
		if (message.member.voiceChannel) {
			message.member.voiceChannel.join()
				.then(connection => console.log('Connected'))
				.catch(console.log);
		}
	},
};