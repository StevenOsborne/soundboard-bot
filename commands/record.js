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
var decoder = new ps.Decoder(config);

function generateOutputFile(member) {
    // use IDs instead of username cause some people have stupid emojis in their name
    const fileName = `./recordings/${member.id}-${Date.now()}.pcm`;
    return fs.createWriteStream(fileName);
  }

module.exports = {
	name: 'record',
    description: 'Records audio',
    notCallable: true,
    args: false,
    voice: true,
	execute(connection, user, args) {
        if (!receiver) {
            receiver = connection.receiver;
        }

        var audioStream = receiver.createStream(user, {mode: 'pcm', end: 'manual'});
        //NEED TO MANUALLY END AUDIOSTREAM

        decoder.startUtt();
        console.log("Start utterance - decoder: " + decoder)
        audioStream.on('data', (chunk) => {
            decoder.processRaw(chunk, false, false);
            var hyp = decoder.hyp();
            if (hyp != null) {
                decoder.endUtt();
                console.log("End utterance - decoder: " + decoder)
                meme.execute(connection, null, args);
                decoder.startUtt();
            }
        });

        // fs.readFile("daffodil/mono_16k_single.pcm", function(err, data) {
        //     if (err) throw err;
        //     decoder.startUtt();
        //     decoder.processRaw(data, false, false);
        //     decoder.endUtt();
        //     console.log(decoder.hyp())
        // });
    },
    end(user) {

    },
};