const fs = require('fs');
const TLIYBotGuilds = JSON.parse(fs.readFileSync('./TLIYBotGuilds/guilds.json', 'utf8'));

const properties =  {
                        "categories": {
                            "TheLifeBot": {
                                "id": null, "name": "TheLifeBot", "channels": {
                                    "CommandCenter": {"id": null, "name": "command-center"}
                                }
                            },
                            "WatchedGames": {
                                "id": null,
                                "name": "Watched Games",
                                "channels":[]
                            },
                            "WatchedStreamers": {
                                "id": null,
                                "name": "Watched Streamers",
                                "channels":[]
                            }
                        }
                    };

//TLIYBotProperties guilds are independent from Discord Clients guilds
//We copy Discord clients guilds id and name, then implement our own categories into our own file system.
//To be able to know where we are, and which TLIYBot client is askign for which room.

// - main folder : contains all our guild properties
// |_ Main index file, contains all our other files and guild. [{"id": guild_id}]
// |_(id as name)
// |_(id as name)

/* PSEUDO CODE FOR THIS FILE
#1 start server
#2 connect discord bot
#3 check server guilds list
    #validate guilds index list
        #if validated
            #find guild properties for each guild on discord bot
        #else not validated
            #make guilds list file
            #make guilds properties
            #add guilds properties to guilds index list
*/

const lookForTLIYBotGuilds = (client) => {
    client = client != undefined ? client : console.error('Error, checkProperties requires a Discord client passed to it');
    return new Promise((resolve, reject) => {
        //Go over each guild and see if the have
        let TLIYGuilds = JSON.parse(fs.readFileSync(`./TLIYBotGuilds/guilds.json`));
        let DiscordGuilds = client.guilds;

        //Make empty array to hold guilds of client.
        let guilds = [];

        //Go over each of our already made "properties"
        for(let TLIYGuild of TLIYGuilds){
            if(TLIYGuild == undefined)
                return;

            let guildPropertiesExists = false;
            let guildInfo = {"id": null, "name": undefined};
            
            for(let DiscordGuild of DiscordGuilds){
                if(DiscordGuild == undefined)
                    return;

                if(DiscordGuild.id == TLIYGuild.id){
                    guildPropertiesExists = true;            
                    //Get used values from DiscordGuild
                    guildInfo.id = DiscordGuild.id;
                    guildInfo.name = DiscordGuild.name;
                }
            }

            if(guildPropertiesExists){   
                guilds.push({"hasProperties": true, id, name, "path": `./TLIYBotGuilds/${id}.json`});
            }else{
                guilds.push({"hasProperties": false, id, name, "path": `./TLIYBotGuilds/${id}.json`});
            }
        }
        
        resolve(guilds);
    })
    .catch((err) => {
        console.error(err);
    });
}

// Write to ./TLIYBotGuilds/guilds.json file;
const updateTLIYBotsGuilds = (json) => {
    return new Promise((resolve, reject) => {
        let pure = JSON.stringify(json);
        fs.writeFileSync(`./TLIYBotGuilds/guilds.json`, pure);
        return true;
    }).then((res) => {
        if(res){
            Console.log(`Successfully update TLIYBotGuilds list`, res);
            resolve(res);
        }
        if(!res){
            Console.log(`Unsuccessfully update TLIYBotGuilds list`, res);
            reject(res);
        }
    }).catch((err) => {
        Console.error(`Unsuccessfully update TLIYBotGuilds list`, err);
    });
};

// #8 - Add guild index to ./TLIYBotsGuilds/guilds.json file
const addNewTLIYBotGuildFile = (guild) => {
    return new Promise(() => {
        TLIYBotGuilds.push(guild);
        updateTLIYBotsGuilds(TLIYBotGuilds);
        return resolve(guild);
    })
    .catch((err) => {
        console.error(`Error while writing to TLIYBotProperties.json`, err);
    });
}

// #9 Make new TLIYBotGuild property file
const makeNewTLIYBotGuildPropertiesFile = (guild) => {
    return new Promise((resolve, reject) => {
        fs.writeFileSync(guild.path);
        return true;
    })
    .then((res) => {
        addGuildPropertiesToGuildFile(guild);
    })
    .catch((err) => {
        console.error(`Error making new guild properties file`, err);
    });
}

// #10 Add fuild properties to guild file ./TLIYBotGuilds/<guild.id>.json
const addGuildPropertiesToGuildFile = (guild) => {
    return new Promise((resolve, reject) => {
        fs.writeFileSync(guild.path, properties);
    })
    .then((res) => {
        
    })
    .catch((err) => {
        console.error(`Error adding new guild properties to file`, err);
    });
}

// #3
const validateTLIYBotGuildsFile = () => {
    return new Promise((resolve, reject) => {
        //If file does not exist, we make it.
        if(!fs.existsSync('./TLIYBotGuilds/guilds.json')){
            return resolve(false);
        }else{
            resolve(true);
        }
    })
    .catch((err) => {
        console.error(`Error checking written TLIYBotProperties.json`, err);
    });
}

// #4
const makeTLIYBotGuildListFile = () => {
    return new Promise((resolve, reject) => {
        let pure = "[]";
        fs.writeFileSync(`./TLIYBotGuilds/guilds.json`, pure);
        return resolve(true);
    })
    .catch((err) => {
        console.error(err);
    })
}

const readGuildProperties = () => {
    return new Promise((resolve, reject) => {
    }).then().catch();
}

const validateFile = (path) => {
    return new Promise((resolve, reject) => {
        path = path != undefined ? path : reject({msg: "An absolute path to a file must be passed on to the validateFile function"});

        if(fs.exists(path)){
            resolve(true);
        }

        resolve(false);
    })
    .catch((err) => {
        console.error(err.msg);
    });
}

//#1 Discord is ready

//#2 check Guilds file
function howItGoes(){
    //#3 validate Guilds file
    validateTLIYBotGuildsFile()
    .then((res) => {
        //If file is validated and is good to go
        if(res){
            //Find Guild properties in the list of guilds
            lookForTLIYBotGuilds()
            .then((res) => {
                if(res.hasProperties){
                    validateFile(res.path).then((validation) => {
                        if(validation){
                            readGuildProperties(res.path)
                        }
                    })
                }

                if(!res.hasProperties){
                    makeNewTLIYBotGuildPropertiesFile(res.path)
                }
            })
        }

        //If file was not validated and is not good to go
        if(!res){
            //Make guilds list file ./TLIYBotGuilds/guilds.json
            makeTLIYBotGuildListFile();
        }
    })
}

howItGoes();

const readWrittenProperties = (guildPropertiesPath) => {
    return new Promise((resolve, reject) => {
        let pure = fs.readFileSync(`./TLIYBotProperties.json`);
        let json = JSON.parse(pure);
        let res = json;
        return res;
    })
    .then((res) => {
        if(res)
            resolve(res);
        if(!res)
            reject(res);
    })
    .catch((err) => {
        console.error(`Error reading written TLIYBotProperties.json`, err);
    });
}

let addCategory_TheLifeBot = (tliyGuild, index, guild) => {
    //Create main bot category and control-room
    return new Promise((resolve, reject) => {
        guild.createChannel('TheLifeBot', 'category')
        .then((parent) => {
            console.log("Made theLifeBot Category");
            tliyGuild.categorys['TheLifeBot'] = {"id": parent.id, "name": parent.name};
            console.log(TheLifeBot.guilds[index].categorys['TheLifeBot']);
            resolve(parent);
        }).catch((err) => {console.log(err); reject(err)})
    });
}

let addChannel_CommandCenter = (tliyGuild, index, guild, parent) => {
    return new Promise((resolve, reject) => {
        guild.createChannel('CommandCenter', 'text')
        .then((child) => {
            child.setParent(parent.id);
            //TLIYBotClientID = child.id;

            console.log("Made commandcenter channel");
            tliyGuild.categorys.TheLifeBot['CommandCenter'] = {"id": child.id, "name": child.name};
            console.log(TheLifeBot.guilds[index].categorys.TheLifeBot['CommandCenter']);
            resolve(child);
        }).catch((err) => {console.log(err); reject(err)})
    });
}


let addCategory_WatchedGames = (tliyGuild, index, guild) => {
    return new Promise((resolve, reject) => {
        //Make watched games category
        guild.createChannel('Watched Games', 'category')
        .then((parent) => {
            console.log("Made Watched Games Category");
            tliyGuild.categorys['WatchedGames'] = {"id": parent.id, "name": parent.name};
            console.log(TheLifeBot.guilds[index].categorys['WatchedGames']);
            resolve(parent);
        }).catch((err) => {console.log(err); reject(err)})
    });
}
    
let addCategory_WatchedStreamers = (tliyGuild, index, guild) => {
    return new Promise((resolve, reject) => {
        //Make watched streamers category
        guild.createChannel('Watched Streamers', 'category')
        .then((parent) => {
            console.log("Made Watched Streamers Category");
            tliyGuild.categorys['WatchedStreamers'] = {"id": parent.id, "name": parent.name}
            console.log(TheLifeBot.guilds[index].categorys['WatchedStreamers']);
            resolve(parent);
        }).catch((err) => {console.log(err); reject(err)})
    });
}


module.exports = addMissingChannels = (client) => {
    checkProperties(client)
    .then((guild) => {
        for(let guild of guilds){
            if(guild.hasProperties == false){
                makePropertiesFor(guild);
            }
        }
        if(res.hasProperties == true){
            console.log('Client.Guilds have properties saved');
        }

        if(res.hasProperties == false){
            console.log('Client.Guild does not have properties saved');
            makePropertiesFor(res);
        }
    }).catch((err) => {
        console.error(err);
    });

    //Make rooms where the bot lives, for each available guild
    for(const [index, guild] of client.guilds.entries()){
        if(guild.available){
            

            for(const [index, tliyGuild] of TheLifeBot.guilds.entries()){
                if(guild.id == tliyGuild.id){
                    if(tliyGuild.categorys == undefined || Object.keys(tliyGuild.categorys) <= 0){
                        console.log("Guild was missing category");
                        tliyGuild.categorys = {};

                        new Promise(async (reject, resolve) => {
                            let parent;

                            await addCategory_TheLifeBot(tliyGuild, index, guild)
                            .then((res) => {console.log(res.id); parent = res;})
                            .catch((err) => {
                                console.error(err);
                            });
                            
                            return parent;
                        }).then(async (parent) => {
                            await addCategory_CommandCenter(tliyGuild, index, guild, parent);
                            return true;
                        }).then(async () => {
                            await addCategory_WatchedGames(tliyGuild, index, guild)
                            return true;
                        }).then(async () => {
                            await addCategory_WatchedStreamers(tliyGuild, index, guild)
                            return true;
                        }).then(() => {
                            console.log("Saving TheLifeBot properties", TheLifeBot.guilds);
                            writeTheLifeProperties(TheLifeBot).then(async (res) => {
                                await res;
                                console.log("Saved TheLifeBot properties", TheLifeBot.guilds);
                                notifie_discord({str: "Finised setup, ready to go!"})
                            })
                            resolve(true);
                        })
                        .catch((err) => {console.error('Error at Promise.all', err); reject(err);});
                    }
                }
            }
        }
    }
}