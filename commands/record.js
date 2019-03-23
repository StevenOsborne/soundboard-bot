const fs = require('fs');
const { spawn } = require('child_process');

var receiver;

function generateOutputFile(member) {
    // use IDs instead of username cause some people have stupid emojis in their name
    const fileName = `./recordings/${member.id}-${Date.now()}.pcm`;
    return fs.createWriteStream(fileName);
  }

module.exports = {
	name: 'record',
    description: 'Records audio',
    args: false,
    voice: true,
	execute(connection, message, args) {
        if (!receiver) {
            receiver = connection.receiver;
        }

        var user = message.member.user;
        var audioStream;
        var outputStream;
            setInterval(function () {
                if (outputStream) {
                    outputStream.end();

                    // var pocketSphinx = spawn('/home/pi/Desktop/pocketsphinx-5prealpha/src/programs/pocketsphinx_continuous',
                    //  ['-infile', outputStream.path, '-keyphrase', 'daffodil']);

                     var pocketSphinx = spawn('/home/pi/Desktop/pocketsphinx-5prealpha/src/programs/pocketsphinx_continuous',
                     ['-infile', '/home/pi/Desktop/pocketsphinx-5prealpha/src/programs/274649816217157632-1552163246973.pcm', '-keyphrase', 'daffodil']);
                    
                     pocketSphinx.stdout.on('data', (data) => {
                        console.log(`stdout: ${data}`);
                    });
                }
                audioStream = receiver.createStream(user, {mode: 'pcm'});
                // audioStream.unpipe(outputStream);

                outputStream = generateOutputFile(user);

                audioStream.pipe(outputStream);
            }, 5000);
	},
};