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
        
        console.log(playing);
        if (playing) {
            queue.push(file);
        } else {
            console.log(`Playing: ${file}`);
            dispatcher = connection.play(`./sounds/${file}.mp3`);
            playing = true;

            dispatcher.on('finish', () => {
                playing = false;
                this.execute(connection, message, queue.pop());
            });
        }
    },
    skip() {
        if (dispatcher) dispatcher.end();
    },
};