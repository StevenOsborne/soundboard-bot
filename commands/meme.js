const fs = require('fs');
const play = require('./play.js')

module.exports = {
	name: 'meme',
    description: 'play a random clip',
    args: false,
    voice: true,
	execute(connection, message, args) {
        let files = fs.readdirSync('./sounds', {withFileTypes: true})
            .filter(item => item.name.includes('.mp3'))
            .filter(item => !item.isDirectory())
            .map(item => item.name);
        let fileNumber = Math.floor(Math.random() * files.length);
        let randomFile = files[fileNumber].replace('.mp3', '');
        
        play.execute(connection, message, randomFile);
	},
};