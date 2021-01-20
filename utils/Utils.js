const Discord = require("discord.js");
const formatFormalTime = require('./formatFormatTime');

class Embed {
    constructor() {
        this.embed = new Discord.MessageEmbed();
        this.embed.setColor('RED');
    }

    /**
     * 
     * @param {string} title 
     * @param {string} description 
     * @param {Discord.EmbedFieldData[]} fields
     */
    setInfo(title, description, fields) {
        if (this.embed) {
            delete this.embed;
            this.embed = new Discord.MessageEmbed();
            this.embed.setColor('RED');
        }
        
        this.embed.setFooter(new Date().toDateString());
        this.embed.setTitle(title);
        if (description) {
            this.embed.setDescription(description);
        }
        if (fields) {
            this.embed.addFields(fields);
        }
        return this.embed;
    }
}

class Logger {
    /**
     * Sends a logger message
     */
    static log(message) {
        console.log(`[${formatFormalTime(new Date(), 'SGT')}-LOG] ${message}`);
    }

    /**
     * Sends an info message
     */
    static info(message) {
        console.log(`[${formatFormalTime(new Date(), 'SGT')}-INFO] ${message}`);
    }

    /**
     * Sends a warn message
     */
    static warn(message) {
        console.log(`[${formatFormalTime(new Date(), 'SGT')}-WARN] ${message}`);
    }
}

module.exports = {
    Embed,
    Logger
};