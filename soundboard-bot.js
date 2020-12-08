//TODO - Bot seems to drop out of discord voice channel after inactivity (maybe it just crashes). It still thinks it is in the correct voice channel
//TODO - Try to log when the bot is dropping out? Could try to disconnect it so that it can just be called back in
require('log-timestamp');
const fs = require('fs');
const Discord = require('discord.js');
const { prefix, token } = process.argv[2] == 'PROD' ? require('./config.json') : require('./qa_config.json');
const { Readable } = require('stream');

const SILENCE_FRAME = Buffer.from([0xF8, 0xFF, 0xFE]);

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}
var voiceConnection
const recordCommand = client.commands.get("recordV2");

async function getConnection(message) {
    console.log("Joining voice channel")
    if (message.member.voice.channel) {
        return message.member.voice.channel.join()
    }
}

class Silence extends Readable {
    _read() {
      this.push(SILENCE_FRAME);
    }
  }

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    if (!client.commands.has(commandName)) return;

    const command = client.commands.get(commandName);

    if (command.args && !args.length) {
        let reply = `You didn't provide any arguments, ${message.author}!`;
        
        if (command.usage) {
            reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
        }
        
        return message.channel.send(reply);
    }

    try {
        if (!command.notCallable) {
            if (command.voice) {
                if (voiceConnection) {
                    console.log('Voice connection status: ' + voiceConnection.status);
                    console.log(voiceConnection);
                    command.execute(voiceConnection, message, args);
                } else {
                    console.log('No voice connection. Requesting voice connection...');
                    await getConnection(message)
                        .then(connection => {
                            voiceConnection = connection;
                            //Fix for losing voice receiver after 5 mins
                            voiceConnection.play(new Silence(), { type: 'opus' });
                            connection.channel.members.each(member => {
                                console.log(member.user.tag);
                                if (member.user.tag !== client.user.tag) {
                                    recordCommand.execute(connection, member.user, null)
                                }
                            });
                            command.execute(connection, message, args);
                        })
                        .catch(error => {
                            console.log('Error getting voice connection.');
                            console.error(error);
                          });
                }
            } else {
                command.execute(message, args);
            }
        }
        
    } catch (error) {
        console.log('Error in main command loop');
        console.error(error);
        message.reply('there was an error trying to execute that command!');
    }
});

client.on('voiceStateUpdate', (oldState, newState) => {
    let newUserChannel = newState.channel;
    let oldUserChannel = oldState.channel;

    if (newState.member.user.tag === client.user.tag) return;

    if (newUserChannel) {
       if (voiceConnection) {
           if (newUserChannel.id === voiceConnection.channel.id &&
            (!oldUserChannel || oldUserChannel.id !== voiceConnection.channel.id)) {
                console.log(`${newState.member.user.tag} Joined bots channel`);
                recordCommand.execute(voiceConnection, newState.member.user, null);
            } else if (oldUserChannel && oldUserChannel.id === voiceConnection.channel.id &&
                newUserChannel.id !== voiceConnection.channel.id) {
                console.log(`${oldState.member.user.tag} Moved from bots channel`);
                recordCommand.end(oldState.member.user);
            }
        }
    } else if (oldUserChannel) {
        if (voiceConnection && oldUserChannel.id === voiceConnection.channel.id) {
            console.log(`${oldState.member.user.tag} Left bots channel`);
            recordCommand.end(oldState.member.user);
        }
    }
  })

client.login(token);