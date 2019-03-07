const fs = require('fs');
var receiver;

function generateOutputFile(member) {
    // use IDs instead of username cause some people have stupid emojis in their name
    const fileName = `./${member.id}-${Date.now()}.mp3`;
    return fs.createWriteStream(fileName);
  }

module.exports = {
	name: 'record',
    description: 'Records audio',
    args: false,
    voice: true,
	execute(connection, message, args) {
        if (!receiver) {
            receiver = connection.createReceiver();
        }

        connection.on('speaking', (user, speaking) => {
            if (speaking) {
                message.channel.send(`I'm listening to ${user}`);

                const audioStream = receiver.createOpusStream(user);
                // create an output stream so we can dump our data in a file
                // const outputStream = generateOutputFile(user);
                // pipe our audio data into the file stream
                // audioStream.pipe(outputStream);
                // outputStream.on("data", console.log);
                // when the stream ends (the user stopped talking) tell the user
                audioStream.on('end', () => {
                message.channel.send(`I'm no longer listening to ${user}`);
            });
            }
        });
	},
};