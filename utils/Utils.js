const { MessageEmbed, EmbedFieldData } = require("discord.js");
const formatFormalTime = require('./formatFormatTime');

/**
 * Useless right now.
 * @deprecated
 */
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

/**
 * Static logger. Formats a message to console / terminal.
 */
class Logger {
    /**
     * Sends a logger message
     */
    static boot(message) {
        console.log(`[${formatFormalTime(new Date(), 'SGT')}-BOOT] ${message}`);
    }
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

class Reacts {
    static get check() { return "✅"; }
    static get cross() { return "❌"; }
    static get question() { return "❔"; }
    static get delete() { return "🗑️"; }
    static get unknown() { return "🟠"; }
    static get accept() { return "🟢"; }
    static get reject() { return "🔴"; }
    static get maybe() { return "🔵"; }
    static get edit() { return "✏️"; }
    static get lock() { return "🔒"; }
    static get unlock() { return "🔓"; }
}

module.exports = {
    Embed,
    Logger,
    Reacts
};