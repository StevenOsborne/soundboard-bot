//TODO
//End audiostream and utterance when they leave
//

const meme = require('./meme.js')
const fs = require('fs');
const ps = require('node-pocketsphinx').ps;

const modeldir = "/usr/local/share/pocketsphinx/model/en-us/";

var receiver;
var config = new ps.Decoder.defaultConfig();
config.setString("-hmm", modeldir + "en-us");
config.setString("-dict", modeldir + "cmudict-en-us.dict");
config.setString("-keyphrase", "daffodil");
config.setString("-kws_threshold", "1e-12");
config.setString("-logfn", "pocketSphinx_log.txt");

function generateOutputFile(member) {
    // use IDs instead of username cause some people have stupid emojis in their name
    const fileName = `./recordings/${member.id}-${Date.now()}.pcm`;
    return fs.createWriteStream(fileName);
  }

module.exports = {
	name: 'record',
    description: 'Records audio',
    callable: false,
    args: false,
    voice: true,
	execute(connection, user, args) {
        if (!receiver) {
            receiver = connection.receiver;
        }

        var decoder = new ps.Decoder(config);
        var audioStream = receiver.createStream(user, {mode: 'pcm', end: 'manual'});
        //NEED TO MANUALLY END AUDIOSTREAM

        decoder.startUtt();
        audioStream.on('data', (chunk) => {
            decoder.processRaw(chunk, false, false);
            var hyp = decoder.hyp();
            if (hyp != null) {
                decoder.endUtt();
                meme.execute(connection, message, args);
                decoder.startUtt();
            }
        });

        //endUtt when closing the audiostream (when user leaves)

        // fs.readFile("daffodil/mono_16k_single.pcm", function(err, data) {
        //     if (err) throw err;
        //     decoder.startUtt();
        //     decoder.processRaw(data, false, false);
        //     decoder.endUtt();
        //     console.log(decoder.hyp())
        // });
	},
};