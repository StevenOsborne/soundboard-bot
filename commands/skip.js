const play = require('./play.js')

module.exports = {
	name: 'skip',
    description: 'skips the current clip',
    args: false,
	execute(message, args) {
        play.skip();
	},
};