const meme = require('./meme.js')
const play = require('./play.js')
const prism = require('prism-media');
const Porcupine = require("@picovoice/porcupine-node");
const {
    GRASSHOPPER,
    BLUEBERRY,
  } = require("@picovoice/porcupine-node/builtin_keywords");

var receiver;
var listeningToUsers = [];
var userStreams = [];
var userHandlers = [];
var userDecoders = [];
var userFrameAccumulators = [[]];

function chunkArray(array, size) {
    return Array.from({ length: Math.ceil(array.length / size) }, (v, index) =>
        array.slice(index * size, index * size + size)
    );
}

module.exports = {
    name: 'recordV2',
    description: 'Records audio',
    notCallable: true,
    args: false,
    voice: true,
    execute(connection, user, args) {
        userHandlers[user] = new Porcupine([GRASSHOPPER, BLUEBERRY], [0.7, 0.85]);
        const frameLength = userHandlers[user].frameLength;
        if (!receiver) {
            receiver = connection.receiver;
        }
        userStreams[user] = receiver.createStream(user, {mode: 'opus', end: 'manual'});
        userDecoders[user] = new prism.opus.Decoder({frameSize: 640, channels: 1, rate: 16000});
        
        userStreams[user]
        .pipe(userDecoders[user]);
        
        listeningToUsers[user] = true;
        userFrameAccumulators[user] = [];
        try {
            userDecoders[user].on('data', (data) => {
                // Two bytes per Int16 from the data buffer
                let newFrames16 = new Array(data.length / 2);
                for (let i = 0; i < data.length; i += 2) {
                    newFrames16[i / 2] = data.readInt16LE(i);
                }
                // Split the incoming PCM integer data into arrays of size Porcupine.frameLength. If there's insufficient frames, or a remainder,
                // store it in 'frameAccumulator' for the next iteration, so that we don't miss any audio data
                userFrameAccumulators[user] = userFrameAccumulators[user].concat(newFrames16);
                let frames = chunkArray(userFrameAccumulators[user], frameLength);

                if (frames[frames.length - 1].length !== frameLength) {
                    // store remainder from divisions of frameLength
                    userFrameAccumulators[user] = frames.pop();
                } else {
                    userFrameAccumulators[user] = [];
                }
                for (let frame of frames) {
                    let index = userHandlers[user].process(frame);
                    if (index !== -1) {
                        if (index == 0) {
                            meme.execute(connection, null, args);
                        } else if (index == 1) {
                            play.skip();
                        }
                    }
                }
            });
        } catch (error) {
            console.error(error);
        }
    },
    end(user) {
        if (listeningToUsers[user]) {
            listeningToUsers[user] = false;
            if (userStreams[user]) {
                userStreams[user].emit('end');
                userStreams[user].destroy();
            }
            if(userHandlers[user]) {
                userHandlers[user].release();
            }
            if(userDecoders[user]) {
                userDecoders[user].end();
            }
            if(userFrameAccumulators[user]) {
                userFrameAccumulators[user] = [];
            }
        }
    },
};