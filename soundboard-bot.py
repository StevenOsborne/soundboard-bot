#Timeout exception
#Clip specific volume - Volume equalizer?
#Add delete
#Write stop script for better stopping??
#Clips not right size? (timing off) - Could be fixed with youtube-dl/ffmpeg work?
#Intergrate the book of our lord - bible.com has an api
#Quickmeme - clips shorter than 5 seconds
#Most played? Change the way info is stored? Metadata? Or just text file?

import logging #LOGGING
import discord
from discord.ext import commands
import asyncio
import os.path
import urllib.parse
import urllib.request
import youtube_dl
import glob
import random
import json
from bs4 import BeautifulSoup

if not discord.opus.is_loaded():
    discord.opus.load_opus('opus')

class VoiceEntry:
    def __init__(self, message, player, title):
        self.requester = message.author
        self.channel = message.channel
        self.player = player
        self.title = title

    def __str__(self):
        fmt = '*{0}* requested by {1.display_name}'
        return fmt.format(self.title, self.requester)

class VoiceState:
    def __init__(self, bot):
        self.current = None
        self.voice = None
        self.bot = bot
        self.play_next_song = asyncio.Event()
        self.songs = asyncio.Queue()
        self.audio_player = self.bot.loop.create_task(self.audio_player_task())

    def is_playing(self):
        if self.voice is None or self.current is None:
            return False

        player = self.current.player
        return not player.is_done()

    @property
    def player(self):
        return self.current.player

    def skip(self):
        if self.is_playing():
            self.player.stop()

    def toggle_next(self):
        self.bot.loop.call_soon_threadsafe(self.play_next_song.set)

    async def audio_player_task(self):
        while True:
            self.play_next_song.clear()
            self.current = await self.songs.get()
            self.current.player.start()
            await self.play_next_song.wait()

class SoundboardBot:
    def __init__(self, bot):
        self.bot = bot
        self.voice_states = {}
        self.logger = logging.getLogger('discord')
        self.logger.setLevel(logging.INFO)
        handler = logging.FileHandler(filename='logs/discord.log', encoding='utf-8', mode='w')
        handler.setFormatter(logging.Formatter('%(asctime)s:%(levelname)s:%(name)s: %(message)s'))
        self.logger.addHandler(handler)

    def get_voice_state(self, server):
        state = self.voice_states.get(server.id)
        if state is None:
            state = VoiceState(self.bot)
            self.voice_states[server.id] = state

        return state

    async def create_voice_client(self, channel):
        voice = await self.bot.join_voice_channel(channel)
        state = self.get_voice_state(channel.server)
        state.voice = voice

    @commands.command(pass_context=True, no_pm=True)
    async def summon(self, ctx):
        """Summons the bot to join your voice channel."""
        summoned_channel = ctx.message.author.voice_channel
        if summoned_channel is None:
            await self.bot.say('You are not in a voice channel.')
            return False

        state = self.get_voice_state(ctx.message.server)
        if state.voice is None:
            state.voice = await self.bot.join_voice_channel(summoned_channel)
        else:
            await state.voice.move_to(summoned_channel)

        return True

    @commands.command(pass_context=True, no_pm=True)
    async def play(self, ctx, arg):
        """Plays a sound clip with the specified title."""
        arg = arg.replace(" ", "_")
        try:
            await self.play_sound(ctx, arg)
        except Exception as e:
           self.logger.exception('Error playing sound - ')

    async def play_sound(self, ctx, command):
        file_path = 'sounds/' + command + '.mp3'
        self.logger.info('Trying to play: ' + file_path)
        if os.path.isfile(file_path):
            state = self.get_voice_state(ctx.message.server)

            if state.voice is None:
                success = await ctx.invoke(self.summon)
                if not success:
                    return
            try:
                player = state.voice.create_ffmpeg_player(file_path, after=state.toggle_next)
                self.logger.info('Playing audio file')
            except Exception as e:
                self.logger.exception('Error playing sound - ')
            else:
                entry = VoiceEntry(ctx.message, player, command)
                # await bot.say('Queued: {}'.format(entry)) Bot message is probably annoying
                await state.songs.put(entry) 
        else:
            # await error()
            self.logger.error('File not found - {0} for command {1}'.format(file_path, command))
            await bot.say('```File not found```')

    @commands.command(pass_context=True, no_pm=True)
    async def stop(self, ctx):
        """Skips what is currently being played (Yes, this should probably be called skip)."""
        state = self.get_voice_state(ctx.message.author.server)

        if not state.is_playing():
            return

        if state.is_playing():
            state.skip()

    @commands.command(pass_context=True, no_pm=True)
    async def pause(self, ctx):
        """Pause what is currently being played"""
        state = self.get_voice_state(ctx.message.author.server)
        if state.is_playing():
            player = state.player
            player.pause()

    @commands.command(pass_context=True, no_pm=True)
    async def resume(self, ctx):
        """Resume what was being played."""
        state = self.get_voice_state(ctx.message.author.server)
        if state.is_playing():
            player = state.player
            player.resume()

    @commands.command(pass_context=True, no_pm=True)
    async def volume(self, ctx, volume: int):
        """Set the volume of the current clip."""
        state = self.get_voice_state(ctx.message.author.server)
        if state.is_playing():
            player = state.player
            player.volume = volume / 100
            await self.bot.say('Set the volume to {:.0%}'.format(player.volume)) #Might want to change volume when not playing clip?

    @commands.command(pass_context=True)
    async def clip(self, ctx, url = None, start = None, duration = None, file_name = None):
        """Create an audio clip, playable using !play <name> - url, start time, duration, file name."""
        if url is None or start is None or duration is None or file_name is None:
            await bot.say('```url, start time, duration, file name```')
            return
        start = start.strip()
        duration = duration.strip()
        file_name = file_name.replace(" ", "_")
        file = 'sounds/' + file_name
        audio_quality = '192'
        
        ydl_opts = {
            'format': 'bestaudio/best',
            }

        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
            video_info = ydl.extract_info(url, download=False)
            audio_url = video_info.get("url", None)
            self.logger.info(audio_url)
        os.system("ffmpeg -y -ss {0} -i \"{1}\" -t {2} -b:a {3}k {4}.mp3".format(start, audio_url, duration, audio_quality, file))

    @commands.command(pass_context=True)
    async def listall(self, ctx):
        """Lists all sound files in alphabetical order."""
        all_files = sorted([os.path.basename(x) for x in glob.glob("sounds/*.mp3")], key=lambda s: s.lower())
        all_files = [os.path.splitext(x)[0] for x in all_files]

        all_files_string = "```\n"
        all_files_string += '\n'.join(str(x) for x in all_files)
        all_files_string += "```"

        await bot.say(all_files_string)

    @commands.command(pass_context=True, no_pm=True)
    async def meme(self, ctx):
        """Plays a random sound file."""
        random_file = random.choice(os.listdir("sounds/"))
        random_file = random_file[:random_file.find(".mp3")]

        try:
            await self.play_sound(ctx, random_file)
        except Exception as e:
            self.logger.exception('Error playing random sound file')

    async def error(self, ):
        await play_file('sounds/icantdothat.mp3')

    @commands.command(name='ytb', pass_context=True, no_pm=True)
    async def youtube(self, ctx, arg):
        """Plays the first youtube result for the given search terms."""
        try:
            await self.play_youtube(ctx, arg)
        except Exception as e:
            self.logger.exception('Error playing youtube video')

    async def play_youtube(self, ctx, command):#Rework getting youtube result - use search from example and give user option
        url = await self.get_first_youtube_result(command)
        state = self.get_voice_state(ctx.message.server)
        self.logger.info('Youtube url: /n ' + url)
        if state.voice is None:
            success = await ctx.invoke(self.summon)
            if not success:
                return
        try:
            player = await state.voice.create_ytdl_player(url, after=state.toggle_next)
            self.logger.info('Playing youtube audio')
        except Exception as e:
            self.logger.exception('Error playing youtube video')
        else:
            entry = VoiceEntry(ctx.message, player, command)
            # await bot.say('Queued: {}'.format(entry)) Bot message is probably annoying
            await state.songs.put(entry) 
        
    async def get_first_youtube_result(self, command): #Does this need to be async?
        query = urllib.parse.quote(command)
        url = "https://www.youtube.com/results?search_query=" + query
        response = urllib.request.urlopen(url)
        html = response.read()
        soup = BeautifulSoup(html, "html.parser")
        return "https://www.youtube.com" + soup.findAll(attrs={'class':'yt-uix-tile-link'})[0]['href']

bot = commands.Bot(command_prefix='!')
bot.add_cog(SoundboardBot(bot))
@bot.event
async def on_ready():
    print('Logged in as '+ bot.user.name)
    print('Connected to servers')
    for server in bot.servers:
        print(server.name)


if __name__ == '__main__':
    with open('config.json') as config_file:
        config = json.load(config_file)
    bot.run(config["token"])