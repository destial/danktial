const Discord = require("discord.js");
const formatFormalTime = require('./formatFormatTime');

class Embed extends Discord.MessageEmbed{
    constructor() {
        super();
        this.setColor('RED');
    }

    /**
     * 
     * @param {string} title 
     * @param {string} description 
     * @param {Discord.EmbedFieldData[]} fields
     */
    setInfo(title, description, fields) {
        this.setTitle(null);
        this.setDescription(null);
        this.fields = [];

        this.setTitle(title);
        if (description) {
            this.setDescription(description);
        }
        if (fields || fields.length) {
            this.addFields(fields);
        }
        console.log(this);
        return this;
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