/* End of constructor */

    updatedWatchedGames(){
        if(this.watchedGames.length >= 1){
            this.watchedGames.map((watchedGame) => {
                let streamNotified = false;

                if(this.notifiedGames.length >= 1){
                    this.notifiedGames.map((notifiedGame) => {

                        if(watchedGame._id == notifiedGame._id){
                            watchedGame.channels.map((watcedStream) => {

                                notifiedGame.channels.map((notifiedStream) => {
                                    if(watcedStream._id == notifiedStream._id){
                                        streamNotified = true;
                                    }
                                });
                            });
                        }
                    });

                    if(!streamNotified){
                        this.emit('notify', {type: "stream", stream: watcedStream});
                    }
                }

                console.log(`There's no streams to notify`);
            });
        }

        console.log(`No games on watch list`);
    }

    notifyStream(stream){
        let guildChannel = this.guild.categories.watcedStream.id;
        if(stream.fromGame){
            guildChannel = this.guild.categories.watchedGames.id;
        }

        this.DiscordClient.channel.send('A steam is playing');
    }
    
    updatedWatchedStreams(){
        
    }

}

/* Twitch game listener */
const gameListenerList = [];
const notifiedStreams = [];
let foundGames = [];

const checkForChangesOnGameList = () => {
    if(gameListenerList.length <= 0){
        console.log("No games on game list");
    }else{
        for(const [index, listener] of gameListenerList.entries()){ //Open live game list
            let streamNotified = false;
            //console.log('Got Listener:', listener);

            if(notifiedStreams.length >= 1){
                console.log('Checking for notified streams');
                for(const [index, notified] of notifiedStreams.entries()){ //Open notified list
                    console.log('Checking Notified:', notified);

                    //Check if game id's match between the gameListenerList and notifiedStreams list
                    if(listener._id == notified._id){

                        //Match gameListener Streams agains notified Streams
                        for(const [index, liveStream] of listener.channels.entries()){ //Look for new live channels entries
                            //console.log("LiveStreams", liveStream);

                            for(const [index, notifiedStream] of listener.channels.entries()){ //Look for new live channels entries    
                                if(liveStream._id == notifiedStream._id)
                                    streamNotified = true;
                            }
                        }
                    }
                }
            }else{
                console.log(`There's no notified streams`);
            }

            if(!streamNotified){
                for(const [index, channel] of listener.channels.entries()){
                    let {display_name, name, game, url, updated_at} = channel;
                    let streamTimer = streamedForTime(updated_at);

                    notifie_discord({str: `**${display_name != undefined ? display_name : name}** is live, playing **${game}** over at ${url} \n They have been live for ${streamTimer.h}:${streamTimer.m}:${streamTimer.s}`});
                    notifiedStreams.push({_id: listener._id});
                }
            }
        }
        
    }

    SearchForTwitchStream();
    setTimeout(() => {checkForChangesOnGameList()}, 10000); //Update every 16 minutes
};

const streamedForTime = (startTime) => {
    streamedFor = new Date(Math.sqrt((new Date().getTime() - new Date(startTime).getTime())**2));
    return {h: streamedFor.getHours()-1, m: streamedFor.getMinutes(), s: streamedFor.getSeconds()};
};

const SearchForTwitchStream = () => {
    //Open each game in gameListenerList
    gameListenerList.forEach((listener) => {
        //Get json list object of streamers based on search query.
        Twitch.search.streams({query: listener.name}, (err, res) => {
            if(err)
                console.error('Error getting Twitch stream search response: ', err);
            
            if(res){
                
                /*******************************************************/
                /*       Method for adding streams that are live       */
                /*******************************************************/

                //Add streams we don't have that we can find in the api.
                res.streams.forEach((stream) => {
                    let channel = stream.channel;
                    let hasStream = false;

                    //Check if the game we found is the same as our gameListener Game
                    if(stream.game != listener.name)
                        return;

                    //Check known stream up agains streams found on twitch api
                    listener.channels.forEach((knownStream) => {
                        //Check if we already have this streamer
                        if(knownStream._id == channel._id)
                            hasStream = true;
                    });

                    //If this stream is not in our list, then add it.
                    if(!hasStream){
                        //Get attributes that makes up the streamer info we need
                        let {_id, display_name, name, game, status, updated_at, url} = channel;
                        //Pass them on as a object in our gameListener game's list of channels streaming
                        listener.channels.push({_id, display_name, name, game, status, updated_at, url});
                    }
                });

                /*******************************************************/
                /* Method for removing streams that have gone offline  */
                /*******************************************************/

                //Check knownStreamers, and remove them from our list if they cannot be found on the twitch api streams list
                listener.channels.forEach((knownStream) => {
                    let detectedStream = false;
                    
                    res.streams.forEach((foundStream) => {
                        if(foundStream.channel.game != knownStream.game)
                            return;

                        if(foundStream.channel._id == knownStream._id){
                            detectedStream = true;
                        }
                    });

                    //If we didn't find knownStreamer in the twitch api's list of channels,
                    //we know they are offline. so we then remove them from our list of knownStreamers
                    if(detectedStream == false){
                        //console.log('Remove streamer, as they are offline', knownStream.display_name);
                        listener.channels.splice(knownStream, 1);
                    }
                });
            }
        });
    });

    //Print out list of streamers in the console for debugging purposes
    gameListenerList.forEach((listener) => {
        console.log("=============================================================================");
        console.log('Game: ', listener.name,'            ', 'knownStreamers: ', listener.channels.length);
        console.log("-----------------------------------------------------------------------------");
        listener.channels.forEach((channel) => {
            console.log('Name: ', channel.display_name, '| Playing: ', channel.game, '| url: ', channel.url);
        });
        console.log("=============================================================================");
    });
};

const sanitize = (str) => {
    return String(str).replace(/&/g, ' ').replace(/</g, ' ').replace(/>/g, ' ').replace(/"/g, ' ').replace(/nbsp;/gi,'');
};

const addStreamListener = (msg) => {
    console.log('add stream listener');
    const regex = /(?<=!TLIY stream add ).*/gm;
    let foundMatch = false;
    let gameTitle;
    let m;

    while ((m = regex.exec(msg.content)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        
        // The result can be accessed through the `m`-variable.
        m.forEach((match) => {
            console.log(`Found gameTitle: ${match}`);
            gameTitle = match;
            foundMatch = true;
        });
    }

    if(foundMatch){
        console.log('searching for games');
        gameTitle = sanitize(gameTitle);
        Twitch.search.games({query: gameTitle}, (err, res) => {
            if(err)
                console.error('Error while adding game to stream listener list: ', err);
    
            if(res){
                foundGames = [];
                //console.log(res);
                if(res.games != null){

                    //Go over twitch results and add them to our list of foundGames
                    res.games.forEach((game) => {
                        let {name, _id, box} = game;
                        foundGames.push({type: "add", name, _id, box, channels:[]});
                    });

                    //Go over our list of foundGames, and check if our list contains more than one item.
                    for(const [index, game] of foundGames.entries()) {
                        if(foundGames.length > 1){
                            let prefix = `Which of these game titles did you mean? \n (Respond with !TLIY pick <#>) \n Your options are: `;
                            let suffix = () => {
                                let str = "";

                                for(const [index, game] of foundGames.entries()){
                                    game.type == "add" ? str += `\n \`\`${index}\`\`: ${game.name}` : null;
                                }

                                return str;
                            }
                            console.log(`${prefix} ${suffix()}`);
                            msg.reply(`${prefix} ${suffix()}`);
                            break;
                        }else if(game.name.toUpperCase() === gameTitle.toUpperCase()){
                            addGameToList(game);
                        }
                    };

                    //console.log('GameListListener: ', gameListenerList);
                }else{
                    console.log(`didn't find any game matching that title`);
                    msg.reply(`Sorry, but we couldn't find any games called **${gameTitle}**`);
                }
            }
        });
    }else{
        console.log(`didn't find any game matching that title`);
        msg.reply(`Sorry, but we couldn't find any games called **${gameTitle}**`);
    }
}

const pickGame = (msg) => {
    console.log('add stream by pick from foundGame list');
    const regex = /(?<=!TLIY pick ).*/gm;
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
            console.log(`Found game pick choice: ${match}`);
            if(!isNaN(match)){
                gamePick = match;
                foundMatch = true
            };
        });
    }
    
    if(foundMatch && foundGames.length >= 1){
        addGameToList(foundGames[gamePick], msg);
    }
}

const addGameToList = (game, msg) => {
    let alreadyAdded = false;
    let {name, _id, box} = game;

    for(const [index, listener] of gameListenerList.entries()){
        if(listener._id == game._id){
            notifie_discord({str: `**${name}** has already been added to the watch list.`, msg: msg});
            alreadyAdded = true;
            break;
        }
    }

    if(!alreadyAdded){
        //Add game to watch list
        gameListenerList.push({name, _id, channels:[]});
        console.log(`Added "${name}" to the watch list!`);

        //Send message to server that you have added the game.
        notifie_discord({str: `Added **${name}** to the watch list!`, file: box.medium, msg: msg});

        //Reset foundGames list
        foundGames = [];
    }
}

const removeStreamListener = (msg) => {
    console.log('add stream listener');
    const regex = /(?<=!TLIY stream remove ).*/gm;
    let foundMatch = false;
    let gameTitle;
    let m;

    while ((m = regex.exec(msg.content)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        
        // The result can be accessed through the `m`-variable.
        m.forEach((match) => {
            console.log(`Found gameTitle: ${match}`);
            gameTitle = match;
            foundMatch = true;
        });
    }

    if(foundMatch){
        console.log('searching for games to remove from list');
        gameTitle = sanitize(gameTitle);
        for(const [index, game] of gameListenerList.entries()){

            //Look for game in our gameListener list
            if(!isNaN(gameTitle)){
                if(foundGames[gameTitle].type == "remove"){
                    //Go over gameListener list and remove appropriet game
                    for(const [index, game] of gameListenerList.entries()){
                        let {name, _id} = game;
                        if(_id == foundGames[gameTitle]._id){
                            gameListenerList.splice(gameTitle, 1);
                            msg.reply(`Removed **${name}** from the watch list.`);
                        }
                    }
                }else{
                    msg.reply(`Only one type of command at once.`);
                }
            }

            if(game.name.toUpperCase === gameTitle.toUpperCase){
                gameListenerList.splice(index, 1);
                msg.reply(`Removed **${gameTitle}** from the watch list.`);
            }else{
                //Go over gameListener list and add them to our list of foundGames
                for(const [index, game] of gameListenerList.entries()){
                    let {name, _id} = game;
                    foundGames.push({type: "remove", name, _id});
                }
                
                let prefix = `Couldn't find any games named **${gameTitle}**, Which of these game titles did you mean? \n (Respond with !TLIY stream remove <#>) \n Your options are: `;
                let suffix = () => {
                    let str = "";

                    for(const [index, game] of foundGames.entries()){
                        game.type == "remove" ? str += `\n \`\`${index}\`\`: ${game.name}` : null;
                    }

                    return str;
                }
                console.log(`${prefix} ${suffix()}`);
                msg.reply(`${prefix} ${suffix()}`);
            }
        }
    }
}