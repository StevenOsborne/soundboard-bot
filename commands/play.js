var queue = [];
var playing = false;
var dispatcher;

module.exports = {
	name: 'play',
    description: 'play clip',
    args: true,
    voice: true,
    usage: '<clipName>',
	execute(connection, message, args) {

        if (args === undefined) return;

        let file = args.toString().replace(/,/g, '_').replace(/"/g, '');
        
        if (playing) {
            queue.push(file);
        } else {
            console.log(`Playing: ${file}`);
            dispatcher = connection.playFile(`./sounds/${file}.mp3`);
            playing = true;

            dispatcher.on('end', () => {
                playing = false;
                this.execute(connection, message, queue.pop());
            });
        }
    },
    skip() {
        if (dispatcher) dispatcher.end();
    },
};