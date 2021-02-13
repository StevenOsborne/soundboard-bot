const fs = require('fs');

splitToChunks(array, chunkSize) {
      var result = [];
      for (var i=0,len=array.length; i<len; i+=chunkSize)
        result.push(array.slice(i,i+chunkSize));
      return result;
    }

module.exports = {
	name: 'list',
    description: 'list all clips',
    args: false,
	execute(message, args) {
        let files = fs.readdirSync('./sounds', {withFileTypes: true})
            .filter(item => item.name.includes('.mp3'))
            .filter(item => !item.isDirectory())
            .map(item => item.name.replace(/_/g, ' ').replace('.mp3', '') + '\n');

        files.sort();

        for (let array of splitToChunks(files, 100)) {
            message.channel.send("```\n" + array.toString().replace(/,/g, '') + "\n```");
        }
	},
};