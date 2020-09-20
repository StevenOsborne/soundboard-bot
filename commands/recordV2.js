const meme = require('./meme.js')
const play = require('./play.js')
const Porcupine = require("@picovoice/porcupine-node");
const {
    GRASSHOPPER,
    BUMBLEBEE,
  } = require("@picovoice/porcupine-node/builtin_keywords");

var receiver;
var listeningToUsers = [];
var userStreams = [];
var userHandlers = [];

module.exports = {
    name: 'recordV2',
    description: 'Records audio',
    notCallable: true,
    args: false,
    voice: true,
    execute(connection, user, args) {
        userHandlers[user] = new Porcupine([GRASSHOPPER, BUMBLEBEE], [0.5, 0.65]);//Should we have instance per user?
        if (!receiver) {
            receiver = connection.receiver;
        }

        console.log(userHandlers[user].sample_rate());
        console.log(userHandlers[user].frame_length());

        userStreams[user] = receiver.createStream(user, {mode: 'pcm', end: 'manual'});
        listeningToUsers[user] = true;

        try {
            console.log("Start utterance");
            userStreams[user].on('data', (chunk) => {
                let keywordIndex = userHandlers[user].process(chunk);

                if (keywordIndex != -1) {
                    meme.execute(connection, null, args);
                }
            });
            // process a single frame of audio
            // the keywordIndex provies the index of the keyword detected, or -1 if no keyword was detected
        } catch (error) {
            console.error(error);
        }
    },
    end(user) {
        if (listeningToUsers[user]) {
            listeningToUsers[user] = false;
            if (userStreams[user]) {
                userStreams[user].end();
            }
            if(userHandlers[user]) {
                userHandlers[user].release();
            }
        }
    },
};