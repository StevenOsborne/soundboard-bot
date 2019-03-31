const fs = require('fs');
const ps = require('node-pocketsphinx').ps;

const modeldir = "/usr/local/share/pocketsphinx/model/en-us/";

var receiver;
var config = new ps.Decoder.defaultConfig();
config.setString("-hmm", modeldir + "en-us");
config.setString("-dict", modeldir + "cmudict-en-us.dict");
config.setString("-keyphrase", "daffodil");
config.setString("-kws_threshold", "1e-12");

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

        // var user = message.member.user;
        var decoder = new ps.Decoder(config);
        // var audioStream = receiver.createStream(user, {mode: 'pcm', end: 'manual'}); //end = manual ?
        //NEED TO MANUALLY END AUDIOSTREAM

        // decoder.startUtt();
        // audioStream.on('data', (chunk) => {
        //     decoder.processRaw(chunk, false, false);
        //     console.log(decoder.hyp());
        //     if (decoder.hyp() == "daffodil") {
        //         decoder.endUtt();
        //     }
        // });

        fs.readFile("daffodil/mono_48k_single.pcm", function(err, data) {
            if (err) throw err;
            decoder.startUtt();
            decoder.processRaw(data, false, false);
            decoder.endUtt();
            console.log(decoder.hyp())
        });
	},
};