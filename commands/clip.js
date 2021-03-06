require('log-timestamp');
const fs = require('fs');
const ytdl = require('ytdl-core');
const { spawn } = require('child_process');

module.exports = {
	name: 'clip',
    description: 'Create a sound clip from a video',
    args: true,
    usage: '<url> <start> <duration> <name>',
	execute(message, args) {
        let [url, start, duration, ...nameArray] = args.map(element => element.replace(/"/g, ''));
        let nameString = 'sounds/' + nameArray.join("_")
		console.log('Clipping: ' + nameString);
		ytdl.getInfo(url).then(info => {
			let format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
			const ffmpeg = spawn('ffmpeg', ['-y', '-ss', start, '-t', duration, '-i', format.url, '-b:a', '192k', `${nameString}.mp3`]);
			ffmpeg.stdout.on('data', (data) => {
				console.log(`stdout: ${data}`);
			});
		}).catch(error => console.log(error));
	},
};
