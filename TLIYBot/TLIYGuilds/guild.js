module.exports = class Client {
    constructor(guild){
        this.guild = guild;
        this.categories = JSON.parse(fs.readFileSync(`TLIYBot/TLIYGuilds/categories.template.json`));

        this.initialize();
    }

    initialize(){
        this.makeBotChannels();
    }
    
    makeBotChannels(){
        if(this.guild.categories == undefined){
            let template = JSON.parse(fs.readFileSync(`TLIYBot/TLIYGuilds/categories.template.json`));
            this.guild.categories = template.categories;

            this.DiscordClient.guilds.forEach((discordGuild) => {
                let promises = [];

                //if(discordGuild.id == guild.id){
                if(discordGuild.id == 513506056630960149){
                    Object.keys(this.guild.categories).forEach((category) => {
                        console.log(`making ${this.guild.categories[category].type} ${this.guild.categories[category].name}`);
                        let p = new Promise((resolve, reject) => {
                            return discordGuild.createChannel(this.guild.categories[category].name, this.guild.categories[category].type)
                            .then((res) => {
                                if(this.guild.categories[category].hasParent){
                                    discordGuild.channels.forEach(channel => {
                                        if(channel.name.toUpperCase() === this.guild.categories[category].parentName.toUpperCase()){
                                            res.setParent(channel.id);
                                        }
                                    })
                                }

                                this.guild.categories[category].id = res.id;
                                resolve();
                            })
                            .catch((err) => {console.error(err)})
                        });

                        promises.push(p);
                    })
                    console.log(promises);

                    Promise.all(promises).then((res) => {this.updateGuildProperties(guild)});
                }
            });
        }else{
            console.log("Already have needed bot channels");
        }
    }
}