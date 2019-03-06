const fs = require('fs');
const ytdl = require('ytdl-core');
const { spawn } = require('child_process');

module.exports = {
	name: 'clip',
    description: 'Create a sound clip from a video',
    args: true,
    usage: '<url> <start> <duration> <name>',
	execute(message, args) {

    //args are being split at space, so multiple arguments cause issue if any of them need spaces
        console.log(args[0]);
        console.log(args[1]);
        console.log(args[2]);
        console.log(args[3]);

        //THIS WORKS
        // ytdl.getInfo(args[0], {quality: 'highestaudio'}, (err, info) => {
        //     if (err) throw err;
        //     const ffmpeg = spawn('ffmpeg', ['-y', '-ss', args[1], '-t', args[2], '-i', info.formats[0].url, '-b:a', '192k', `${args[3]}.mp3`]);
        //     ffmpeg.stdout.on('data', (data) => {
        //         console.log(`stdout: ${data}`);
        //     });
        //   });
	},
};