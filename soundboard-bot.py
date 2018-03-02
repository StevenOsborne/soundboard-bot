#Logging - http://discordpy.readthedocs.io/en/latest/logging.html
#Make a config file to hold the discord bot tokens
#Clean up your code you filthy animal
#Clip specific volume - Volume equalizer?
#Add delete
#Write start and stop script so that we don't need to keep ssh onto pi
#Add queue? (play clip queue?)
#Fix clipping errors - (same video worked at different times?) - snakeater doesn't work after 10 seconds in
#Getters and setters for player/voice
#state machine - so we can't have multiple things running
#Clips not right size?? (timing off)
#Can call play sound without having voice (voice is null)
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

# logging.basicConfig(level=logging.INFO) #LOGGING
logger = logging.getLogger('discord')
logger.setLevel(logging.DEBUG)
# handler = logging.FileHandler(filename='discord.log', encoding='utf-8', mode='w')
# handler.setFormatter(logging.Formatter('%(asctime)s:%(levelname)s:%(name)s: %(message)s'))
# logger.addHandler(handler)

bot = commands.Bot(command_prefix='!')
voice = None
player = None
player_volume = 1

@bot.event
async def on_ready():
    print('Logged in as '+ bot.user.name)
    print('Connected to servers')
    for server in bot.servers:
        print(server.name)

@bot.command(pass_context=True)
async def play(ctx, arg):
    arg = arg.replace(" ", "_")
    if not bot.is_voice_connected(ctx.message.author.server):
        global voice
        voice = await bot.join_voice_channel(ctx.message.author.voice_channel)
        await play_sound(arg)
    else:
        await play_sound(arg)

@bot.command(name='ytb', pass_context=True)
async def youtube(ctx, arg):
    if not bot.is_voice_connected(ctx.message.author.server):
        global voice
        voice = await bot.join_voice_channel(ctx.message.author.voice_channel)
        await play_youtube(arg)
    else:
        await play_youtube(arg)

@bot.command(pass_context=True)
async def stop(ctx):
    if player is not None:
        player.stop()

@bot.command(pass_context=True)
async def pause(ctx):
    if player is not None:
        player.pause()

@bot.command(pass_context=True)
async def resume(ctx):
    if player is not None:
        player.resume()

@bot.command(pass_context=True)
async def volume(ctx, volume: int):
    global player_volume
    player_volume = volume / 100
    print('Volume set to: %f' % player_volume)
    if player is not None:
        player.volume = player_volume

@bot.command(pass_context=True)
async def clip(ctx, url = None, start = None, duration = None, file_name = None):
    if url is None or start is None or duration is None or file_name is None:
        await bot.say('```url, start time, duration, file name```')
        return
    start = start.strip()
    duration = duration.strip()
    file_name = file_name.replace(" ", "_")
    file = 'sounds/' + file_name + '.'
    ydl_opts = {
        'outtmpl': file + '%(ext)s',
        'format': 'bestaudio/best',
        'extractaudio': True,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192'
        }],
        'postprocessor_args': [
            "-ss",
            start,
            "-t",
            duration,
        ],
    }
    print(ydl_opts)
    with youtube_dl.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

@bot.command(pass_context=True) #Need to change to '/' for raspbian
async def listall(ctx):
    all_files = sorted([os.path.basename(x) for x in glob.glob("sounds/*.mp3")], key=lambda s: s.lower())
    all_files = [os.path.splitext(x)[0] for x in all_files]

    all_files_string = "```\n"
    all_files_string += '\n'.join(str(x) for x in all_files)
    all_files_string += "```"

    await bot.say(all_files_string)

@bot.command(pass_context=True)
async def meme(ctx):
    random_file = random.choice(os.listdir("sounds/"))
    random_file = random_file[:random_file.find(".mp3")]
    if not bot.is_voice_connected(ctx.message.author.server):
        global voice
        voice = await bot.join_voice_channel(ctx.message.author.voice_channel)
        await play_sound(random_file)
    else:
        await play_sound(random_file)

# @bot.command(pass_context=True)
# async def help(ctx):
#     bot.say('Write some help crap here')

async def error():
    await play_file('sounds/icantdothat.mp3')

async def play_sound(command):
    file_path = 'sounds/' + command + '.mp3'
    print('Trying to play: ' + file_path)
    if os.path.isfile(file_path):
        await play_file(file_path)
    else:
        await error()
        print('File not found')
        
async def play_file(file_path): #Does this need to be async?
    global player
    player = voice.create_ffmpeg_player(file_path)
    player.volume = player_volume
    player.start()
    print('Playing audio')

async def play_youtube(command):#Rework getting youtube result - use search from example and give user option
    try:
        url = await get_first_youtube_result(command)
        print("url")
        print(url)
        print("END OF url")
        global player
        player = await voice.create_ytdl_player(url)
        player.volume = player_volume
        player.start()
        print(player.views)
        print('Playing youtube audio')
    except:
        await error()
        print('Failed to play youtube audio')
     
async def get_first_youtube_result(command): #Does this need to be async?
    query = urllib.parse.quote(command)
    url = "https://www.youtube.com/results?search_query=" + query
    response = urllib.request.urlopen(url)
    html = response.read()
    soup = BeautifulSoup(html, "html.parser")
    return "https://www.youtube.com" + soup.findAll(attrs={'class':'yt-uix-tile-link'})[0]['href']

if __name__ == '__main__':
    with open('config.json') as config_file:
        config = json.load(config_file)
    bot.run(config["token"])