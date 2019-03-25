const fs = require('fs');
const ps = require('node-pocketsphinx').ps;

const modeldir = "/usr/local/share/pocketsphinx/model/en-us/";

var receiver;
var config = new ps.Decoder.defaultConfig();
config.setString("-hmm", modeldir + "en-us");
config.setString("-dict", modeldir + "cmudict-en-us.dict");
config.setString("-keyphrase", "daffodil");

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
        var decoder = new ps.Decoder(config);
        var audioStream = receiver.createStream(user, {mode: 'pcm'}); //end = manual ?

        decoder.startUtt();
        audioStream.on('data', function(data) {
            decoder.processRaw(data, false, false);
            console.log(decoder.hyp());
            if (decoder.hyp() == "something") {
                decoder.endUtt();
                mic.stopCapture();
            }
        });

        // var pocketSphinx = spawn('/home/pi/Desktop/pocketsphinx-5prealpha/src/programs/pocketsphinx_continuous',
        //     ['-infile', outputStream.path, '-keyphrase', 'daffodil']);

        //     pocketSphinx.stdout.on('data', (data) => {
        //     console.log(`stdout: ${data}`);
        // });

        // pocketSphinx.stderr.on('data', (data) => {
        //     console.log(`stderr: ${data}`);
        // });
	},
};