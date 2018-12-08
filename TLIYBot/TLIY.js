"use strict"
const fs = require('fs');
const Guild = require(__dirname+`/TLIYGuilds/guild.js`);
const Twitch = require(`./TLIYtwitch/twitch.js`);

module.exports.Client = class Client {
    constructor(guild) {
        this.guild = guild;
        this.id = guild.id;

        this.categories = null;
        this.TwitchClient = new Twitch.Client();

        this.commands = [
            //{regex: /-(-)?(commands)?(help)?/gm, str: '--commands/help', funct: this.listCommands()},
            {regex: /twitch add game/gm, str: 'twitch add game', funct: (msg) => {this.TwitchClient.game.add(msg)}},
            {regex: /twitch remove game/gm, str: 'twitch remove game', funct: (msg) => {this.TwitchClient.game.remove(msg)}},
            {regex: /twitch add stream/gm, str: 'twitch add stream', funct: (msg) => {this.TwitchClient.stream.add(msg)}},
            {regex: /twitch remove stream/gm, str: 'twitch remove stream', funct: (msg) => {this.TwitchClient.stream.remove(msg)}},
            {regex: /pick/gm, str: 'pick', funct: (msg) => {this.TwitchClient.pick(msg)}}
        ];

        this.initialize();
        
        this.TwitchClient.on('notifyGame', (event) => {
            let CommandCenter = this.guild.channels.get(this.categories.CommandCenter.id);
            let WatchedGames = this.guild.channels.get(this.categories.WatchedGames.id);

            if(event.type == "add"){
                event.data.then((data) => {
                    console.log(data);
                    if(data.status == 0){
                        CommandCenter.send(`Could not find any game title called \*\*${data.gameTitle}\*\*`);
                    }
    
                    if(data.status == 1){
                        let channelListener = this.guild.channels.find(channel => {
                            let channelName = channel.name.toUpperCase().replace(/[^a-zA-Z0-9]+/g,'-');
                            let gameTitle = data.gameTitle.toUpperCase().replace(/[^a-zA-Z0-9]+/g,'-');
                            if(channelName === gameTitle){
                                return channel;
                            }
                        });

                        if(channelListener != null){
                            CommandCenter.send(`\*\*${data.gameTitle}\*\* already exists in the game listener <\#${channelListener.id}>`);
                        } else {
                            this.guild.createChannel(data.gameTitle, 'text').then((channel) => {
                                channel.setParent(WatchedGames.id);
                                channel.send(`Game listener for \*\*${data.gameTitle}\*\* ${data.game.url.replace(/[\s]+/g, '%20')}`);
                                let gameData = data.game; gameData.discord_id = channel.id;

                                this.categories.WatchedGames.channels.map((game) => {
                                    if(game._id !== gameData._id){
                                        this.categories.WatchedGames.channels.push(gameData);
                                    }
                                });

                                this.updateGuildProperties();
                                console.log(this.categories.WatchedGames.channels);
                                CommandCenter.send(`\*\*${data.gameTitle}\*\* was added to game listener <\#${channel.id}>`);
                            });
        
                        }
                    }
                    
                    if(data.status == 2){
                        CommandCenter.send(`There are mutiple game sharing the same title, which one of these did you mean? (Respond with \`\`!TLIY  #n\`\`) ${data.foundGames.map((game, index) => {return `\n #${index+1}: ${game.name}`})}`);
                    }
                }).catch((err) => {
                    console.error(err);
                    CommandCenter.send(`Something went wrong when fethcing the game title, call for a moderator to look into it.`);
                });
            }

            if(event.type == "remove"){
                CommandCenter.send(`${event.data.name} was removed from game listener`);
            }

            if(event.type == "update"){
                event.data.then((data) => {
                    if(data.stream.status == "live"){
                        let channelListener = this.guild.channels.find(channel => {
                            let channelName = channel.name.toUpperCase().replace(/[^a-zA-Z0-9\_\-]+/g,'-');
                            let streamName = data.streamName.toUpperCase().replace(/[^a-zA-Z0-9\_\-]+/g,'-');
                            
                            if(channelName === streamName){
                                return channel;
                            }
                        });

                        channelListener.send(`${data.stream.name} is ${data.stream.status} playing ${data.stream.game}`);
                    }
                }).catch((err) => {
                    console.error(err);
                    CommandCenter.send(`Something went wrong when fethcing the stream, call for a moderator to look into it.`);
                });
            }
        });
        
        this.TwitchClient.on('notifyStream', (event) => {
            let CommandCenter = this.guild.channels.get(this.categories.CommandCenter.id);
            let WatchedStreamers = this.guild.channels.get(this.categories.WatchedStreamers.id);

            if(event.type == "add"){
                event.data.then((data) => {
                    console.log(data);
                    if(data.status == 0){
                        CommandCenter.send(`Could not find any streamer called \*\*${data.streamName}\*\*`);
                    }
    
                    if(data.status == 1){
                        let channelListener = this.guild.channels.find(channel => {
                            let channelName = channel.name.toUpperCase().replace(/[^a-zA-Z0-9\_\-]+/g,'-');
                            let streamName = data.streamName.toUpperCase().replace(/[^a-zA-Z0-9\_\-]+/g,'-');
                            
                            if(channelName === streamName){
                                return channel;
                            }
                        });

                        if(channelListener != null){
                            CommandCenter.send(`\*\*${data.streamName}\*\* already exists in the stream listener <\#${channelListener.id}>`);
                        } else {
                            this.guild.createChannel(data.streamName, 'text').then((channel) => {
                                channel.setParent(WatchedStreamers.id);
                                channel.send(`Stream listener for \*\*${data.streamName}\*\* ${data.stream.url.replace(/[\s]+/g, '%20')}`);
                                let streamData = data.stream; streamData.discord_id = channel.id;
                                let streamExists = false;

                                this.categories.WatchedStreamers.channels.map((stream) => {
                                    if(stream._id == streamData._id){
                                        streamExists = true;
                                    }
                                });
                                
                                if(!streamExists){
                                    console.log("APPEND STREAM TO CATEGORIES FILE");
                                    this.categories.WatchedStreamers.channels.push(streamData);
                                    this.updateGuildProperties();
                                }

                                console.log(this.categories.WatchedStreamers.channels);
                                CommandCenter.send(`\*\*${data.streamName}\*\* was added to stream listener <\#${channel.id}>`);
                            });
        
                        }
                    }
                    
                    if(data.status == 2){
                        CommandCenter.send(`There are mutiple streams sharing the streamer name, which one of these did you mean? (Respond with \`\`!TLIY pick n\`\`) ${data.streams.map((stream, index) => {return `\n #${index+1}: ${stream.name}`})}`);
                    }
                }).catch((err) => {
                    console.error(err);
                    CommandCenter.send(`Something went wrong when fethcing the stream, call for a moderator to look into it.`);
                });
            }

            if(event.type == "remove"){
                CommandCenter.send(`${event.data.name} was removed from stream listener`);
            }

            if(event.type == "update"){
                event.data.then((data) => {
                    if(data.stream.status == "live"){
                        let channelListener = this.guild.channels.find(channel => {
                            let channelName = channel.name.toUpperCase().replace(/[^a-zA-Z0-9\_\-]+/g,'-');
                            let streamName = data.streamName.toUpperCase().replace(/[^a-zA-Z0-9\_\-]+/g,'-');
                            
                            if(channelName === streamName){
                                return channel;
                            }
                        });

                        channelListener.send(`${data.stream.name} is ${data.stream.status} playing ${data.stream.game}`);
                    }
                }).catch((err) => {
                    console.error(err);
                    CommandCenter.send(`Something went wrong when fethcing the stream, call for a moderator to look into it.`);
                });
            }
        });
    }

    initialize() {
        this.getGuildCategories().then((res) => {
            this.categories = res;
        }).then(() => {
            this.makeBotChannels();
        }).then(() => {
            this.TwitchClient.checkStreamListeners(this.guild, this.categories);
        });

    }

    getGuildCategories() {
        return new Promise((resolve) => {            
            if(!fs.existsSync(`TLIYBot/TLIYGuilds/${this.guild.id}.json`)) {
                fs.writeFileSync(`TLIYBot/TLIYGuilds/${this.guild.id}.json`,
                    fs.readFileSync(`TLIYBot/TLIYGuilds/categories.template.json`)
                );      
            }
            resolve(JSON.parse(fs.readFileSync(`TLIYBot/TLIYGuilds/${this.guild.id}.json`)));
        }).catch((err) => {console.error(err)});
    }

    updateGuildProperties() {
        fs.writeFileSync(`TLIYBot/TLIYGuilds/${this.guild.id}.json`, JSON.stringify(this.categories));
    }

    /* Discord channels handeling*/
    makeBotChannels() {
        let promises = [];

        for(let category in this.categories) {
            let channelExists = false;

            //Check if channel already exists on guild
            this.guild.channels.forEach(channel => {
                if(channel.id === this.categories[category].id){
                    console.log(`${category} already exists on guild ${this.guild.name}`);
                    channelExists = true;
                }
            });
            
            if(!channelExists){
                let p = new Promise((resolve, reject) => {
                    console.log(this.categories[category].name);
                    return this.guild.createChannel(this.categories[category].name, this.categories[category].type)
                    .then((res) => {
                        if(this.categories[category].hasParent){
                            this.guild.channels.forEach(channel => {
                                if(channel.name.toUpperCase() === this.categories[category].parentName.toUpperCase()){
                                    res.setParent(channel.id);
                                }
                            })
                        }
    
                        this.categories[category].id = res.id;
                        resolve();
                    })
                    .catch((err) => {console.error(err)})
                });
    
                promises.push(p);
            }
        }

        Promise.all(promises).then(() => {this.updateGuildProperties()});
    }

    /* Discord message handeling */
    newMessage(msg){
        let foundMatch = false;
        const regex = /!TLIY/gm; //TLIY BOT TRIGGER WORD
        const str = msg.content;
        let m;
    
        while ((m = regex.exec(str)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            
            // The result can be accessed through the `m`-variable.
            m.forEach((match) => {
                console.log(`Found trigger word: ${match}`);
                foundMatch = true;
            });
        }
    
        if(foundMatch){
            let m;
            this.commands.forEach((key) => {
                while ((m = key.regex.exec(str)) !== null) {
                    // This is necessary to avoid infinite loops with zero-width matches
                    if (m.index === key.regex.lastIndex) {
                        key.regex.lastIndex++;
                    }
                    
                    // The result can be accessed through the `m`-variable.
                    m.forEach((match) => {
                        if(match == key.str){
                            console.log(`Found keyword: ${match} | in: ${str}`);
                            
                            if(key.funct != undefined){
                                key.funct(msg);
                            }
                        }
                    });
                }
            });
        }
    }
}