module.exports = {
	name: 'ping',
    description: 'Ping!',
    args: true,
    usage: '<test>',
	execute(message, args) {
		message.channel.send('Pong.');
	},
};