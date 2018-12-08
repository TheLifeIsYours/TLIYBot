const EventEmitter = require('events');
const fs = require('fs');
const Twitch = require("twitch-api-v5");
const tokens = JSON.parse(fs.readFileSync('TLIYBot/clientids.json'));
Twitch.clientID = tokens.twitch_client;

module.exports.Client = class Client extends EventEmitter {
    constructor() {
        super();
        this.notificationUpdateTimeout = 10000;
        this.gameNotificationsIsActive = false;
        this.streamNotificationsIsActive = false;

        this.foundGames = [];

        this.watchedGames = [];
        this.notifiedGames = [];

        this.game = {
            add: (msg, gameTitle) => {
                gameTitle = gameTitle != undefined ? gameTitle : this.getTwitchLabel(msg);
                this.emit('notifyGame', {type: "add", data: this.getGameData(gameTitle)});
                this.gameNotificationsIsActive = true;
            },

            remove: (game) => {
                gameTitle = gameTitle != undefined ? gameTitle : this.getTwitchLabel(msg);
                this.emit('notifyGame', {type: "remove", data: this.removeGameListener(gameTitle)});
            }
        }

        this.watcedStreams = [];
        this.notifiedStreams = [];

        this.stream = {
            add: (msg, streamName) => {
                streamName = streamName != undefined ? streamName : this.getTwitchLabel(msg);
                this.emit('notifyStream', {type: "add", data: this.getStreamData(streamName)});
                this.streamNotificationsIsActive = true;
            },

            remove: (msg, streamName) => {
                streamName = streamName != undefined ? streamName : this.getTwitchLabel(msg);
                this.emit('notifyStream', {type: "remove", data: this.removeStreamListener(stream)});
            }
        }
    }

    checkStreamListeners(guild, categories) {
        let WatchedStreamers = guild.channels.get(categories.WatchedStreamers.id);
        this.streamNotificationsIsActive = WatchedStreamers.children.length >= 1 ? true : false;

        WatchedStreamers.children.map((child) => {
            let streamName = child.name.replace(/[-]+/gm, ' ');
            let streamIsWatched = false;

            this.watcedStreams.map((watchedStream) => {
                if(watchedStream.name == streamName){
                    streamIsWatched = true;
                }
            });

            if(!streamIsWatched){
                this.watcedStreams.push(this.getStreamData(streamName));
            }
        });

        if(this.streamNotificationsIsActive)
            this.updateStreamNotifications();

        let WatchedGames = guild.channels.get(categories.WatchedGames.id);
        this.gameNotificationsIsActive = WatchedGames.children.length >= 1 ? true : false;

        WatchedGames.children.map((child) => {
            categories.WatchedGames.channels.map((game) => {
                if(game.discord_id === child.id){
                    this.getGameData(game.name);
                }
            });
        });

        if(this.gameNotificationsIsActive)
            this.updateGameNotifications();
    }

    getGameData(gameTitle) {
        let data = {status: 0, gameTitle, game: null, foundGames: []};
        console.log("Looking for game title:", gameTitle);
        
        return new Promise((resolve, reject) => {
            Twitch.search.games({query: gameTitle}, (err, res) => {
                if(err){
                    console.error('Error while adding GameListener: ', err);
                    reject();
                }

                if(res.games != null && res.games.length >= 1){
                    res.games.map((game) => {
                        data.status = (game.name.toUpperCase() === gameTitle.toUpperCase() && res.games.length == 1) ? 1 : 2;
                        data.game = {name: game.name, _id: game._id, box: game.box.medium, url: `https://www.twitch.tv/directory/game/${game.name}`, channels: []};
                        
                        if(data.status == 2){
                            this.foundGames.push(data.game);
                            data.foundGames.push(data.game);
                        }
                    });

                    if(data.status == 1){
                        this.game.channels.map((channel) => {
                            stream = this.getStreamData(channel.name);
                            data.game.channel.push(stream.data);
                        });
                        this.watchedGames.push(data.game);
                    }
                    
                    resolve(data);
                }
            });
        }).catch((err) => {console.error(err)});
    }

    removeGameListener(gameTitle) {
        return new Promise((resolve, reject) => {
            this.watchedGames.map((index, game) => {
                if(game.name.toUpperCase() === gameTitle.toUpperCase()){
                    this.watchedGames.splice(index, 1);
                    resolve();
                }
            });

            reject();
        });
    }

    updateGameNotifications() {
        if(this.gameNotificationsIsActive){
            if(this.watcedStreams.length >= 0){
                this.gameNotificationsIsActive = false;
                return;
            }

            this.watchedGames.map((game) => {
                this.notifiedGames.map((notifiedGame) => {
                    if(game._id === notifiedGame._id){
                        let gameData = this.getGameData(game.name);
                        gameData.channel.map((stream) => {
                            console.log(stream);
                        });
                    }
                });

                if(!gameIsNotified){
                    this.emit('notifyGame', {"type": "update", data: this.getGameData(game.name)});
                }
            });
            
            setTimeout(() => {this.updateGameNotifications()}, this.notificationUpdateTimeout);
        }
    }

    getStreamData(streamName) {
        let data = {status: 0, streamName, stream: null, foundStreams: []};
        console.log("Looking for streamer:", streamName);
        
        return new Promise((resolve, reject) => {
            Twitch.search.streams({query: streamName}, (err, res) => {
                if(err){
                    console.error('Error while adding StreamListener: ', err);
                    reject();
                }

                if(res.streams.length >= 1){
                    res.streams.map((stream) => {
                        //console.log("FOUND STREAM", stream);
                        data.status = (stream.channel.name.toUpperCase() === streamName.toUpperCase() && res.streams.length == 1) ? 1 : 2;
                        data.stream = {"name": stream.channel.name, "_id": stream.channel._id, "status": stream.channel.status, "url": stream.channel.url, "game": stream.channel.game, "logo": stream.channel.logo};
                        
                        if(data.status == 2){
                            this.foundGames.push(data.stream);
                            data.foundStreams.push(data.stream);
                        }
                    });

                    if(data.status == 1){
                        this.watcedStreams.push(data.stream);
                    }

                    resolve(data);
                }

                reject(`${streamName} is not live at the moment`);
            });
        }).catch((err) => {console.error(err)});
    }

    removeStreamListener(streamName) {
        return new Promise((resolve, reject) => {
            this.watcedStreams.map((index, stream) => {
                if(stream.name.toUpperCase() === streamName.toUpperCase()){
                    this.watchedStreams.splice(index, 1);
                    resolve();
                }
            });

            reject();
        });
    }

    updateStreamNotifications() {
        console.log("STREAM UPDATE CALLED");
        if(this.watcedStreams.length <= 0){
            console.log("wateched streams are less than 0");
            this.streamNotificationsIsActive = false;
            return;
        }

        console.log("STREAM UPDATE checking");

        this.watcedStreams.map((stream) => {
            let streamIsNotified = false;
            
            this.notifiedStreams.map((notifiedStream) => {
                if(stream._id === notifiedStream._id){
                    streamIsNotified = true;
                }
            });

            if(!streamIsNotified){
                this.emit('notifyStream', {"type": "update", data: this.getStreamData(stream.name)});
            }
        });

        setTimeout(() => {this.updateStreamNotifications()}, this.notificationUpdateTimeout);
    }
    
    sanitize(str) {
        return String(str).replace(/&/g, ' ').replace(/</g, ' ').replace(/>/g, ' ').replace(/"/g, ' ').replace(/nbsp;/gi,'');
    }
    
    getTwitchLabel(msg) {
        const regex = /(?<=!TLIY twitch add (stream|game)\s)[\s\S]+/gm;
        let match = regex.exec(msg.content);
        console.log(`Found TwitchLabel: ${match[0]}`);
        console.log('searching for TwitchLabel');
        return this.sanitize(match[0]);
    }
    
    pick(msg) {
        console.log('add stream by pick from foundGame list');
        const regex = /(?<=!TLIY pick (\#)?).*/gm;
        let foundMatch = false;
        let gamePick;
        let m;
    
        while ((m = regex.exec(msg.content)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            
            // The result can be accessed through the `m`-variable.
            m.forEach((match) => {
                if(!isNaN(match)){
                    console.log(`Found game pick choice: ${match}`);
                    gamePick = match;
                    foundMatch = true
                }
            });
        }
        
        if(foundMatch && this.foundGames.length >= 1){
            this.game.add(msg, this.foundGames[gamePick-1].name);
            this.foundGames = [];
        }
    }
}