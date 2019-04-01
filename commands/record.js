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
var listeningToUsers = [];
var userStreams = [];
var userDecoders = [];

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

        userStreams[user] = receiver.createStream(user, {mode: 'pcm', end: 'manual'});
        userDecoders[user] = new ps.Decoder(config);
        listeningToUsers[user] = true;

    try {
        userDecoders[user].startUtt();
        console.log("Start utterance");
        userStreams[user].on('data', (chunk) => {
            userDecoders[user].processRaw(chunk, false, false);
            var hyp = userDecoders[user].hyp();
            if (hyp != null) {
                userDecoders[user].endUtt();
                console.log(hyp);
                console.log("keyphrase detected - End utterance")
                meme.execute(connection, null, args);
                userDecoders[user].startUtt();
            }
        });
    } catch (error) {
        console.error(error);
    }

        // fs.readFile("daffodil/mono_16k_single.pcm", function(err, data) {
        //     if (err) throw err;
        //     decoder.startUtt();
        //     decoder.processRaw(data, false, false);
        //     decoder.endUtt();
        //     console.log(decoder.hyp())
        // });
    },
    end(user) {
        if (listeningToUsers[user]) {
            if (userStreams[user]) {
                userStreams[user].end();
            }

            if (userDecoders[user]) {
                userDecoders[user].endUtt();
            }
        }
    },
};