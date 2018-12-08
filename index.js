const Discord = require("discord.js");
const imgur = require("imgurgen");
const Twitch = require("twitch-api-v5");
const fs = require('fs');
const TLIYBot = require('./TLIYBot/TLIY.js');

const client = new Discord.Client();

const tokens = JSON.parse(fs.readFileSync('./TLIYBot/clientids.json', 'utf8'));
client.login(tokens.discord_client);

const ActiveGuildClients = [];

client.on('ready', () => {
    client.guilds.map((guild) => {
        if(guild.id == "513506056630960149"){
            ActiveGuildClients.push(new TLIYBot.Client(guild));
        }
    });
});

client.on('message', (msg) => {
    ActiveGuildClients.map((guildClient) => {
        if(msg.guild.id === guildClient.id && msg.channel.id == guildClient.categories.CommandCenter.id){
            guildClient.newMessage(msg);
        }
    });
});