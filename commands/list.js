const fs = require('fs');

module.exports = {
	name: 'list',
    description: 'list all clips',
    args: false,
	execute(message, args) {
        let files = fs.readdirSync('./sounds', {withFileTypes: true})
            .filter(item => item.name.includes('.mp3'))
            .filter(item => !item.isDirectory())
            .map(item => item.name.replace(/_/g, ' ').replace('.mp3', '') + '\n');
        
        message.channel.send("```\n" + files.toString().replace(/,/g, '') + "\n```");
	},
};