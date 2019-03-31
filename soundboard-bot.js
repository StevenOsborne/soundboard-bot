const fs = require('fs');
const Discord = require('discord.js');
const { prefix, token } = require('./config.json');

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

var voiceConnection

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

async function getConnection(message) {
    console.log("Joining voice channel")
    if (message.member.voice.channel) {
        return message.member.voice.channel.join()
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
        if (command.voice) {
            if (voiceConnection) {
                command.execute(voiceConnection, message, args);
            } else {
                await getConnection(message)
                    .then(connection => {
                        voiceConnection = connection;
                        command.execute(connection, message, args);
                    });
            }
        } else {
            command.execute(message, args);
        }
        
    } catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!');
    }
});

client.on('voiceStateUpdate', (oldState, newState) => {
    let newUserChannel = newState.member.voiceChannel
    let oldUserChannel = oldState.member.voiceChannel

    if (newState) {
        console.log(newState.member)
    }

    if (oldState) {
        console.log(oldState.member);
    }
    
    if (oldUserChannel === undefined && newUserChannel !== undefined) {
  
       console.log("joined");
  
    } else if (newUserChannel === undefined) {
  
        console.log("left");
  
    }
  })

client.login(token);