const { MessageEmbed, EmbedFieldData } = require("discord.js");
const formatFormalTime = require('./formatFormatTime');

class Embed {
    /**
     * @param {string} title 
     * @param {string} description 
     * @param {EmbedFieldData[]} fields
     */
    static setInfo(title, description, fields) {
        const embed = new MessageEmbed();
        embed.setTitle(title);
        if (description) {
            embed.setDescription(description);
        }
        if (fields || fields.length) {
            embed.addFields(fields);
        }
        console.log(embed);
        return embed;
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