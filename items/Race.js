const RaceResult = require("./RaceResult");
const Tier = require("./Tier");

class Race {
    /**
     * 
     * @param {Tier} tier 
     * @param {string} name
     * @param {Date} date 
     */
    constructor(tier, name, date, timezone) {
        this.tier = tier;
        this.name = name;
        this.date = date;
        this.timezone = timezone;
        this.link = undefined;

        /**
         * @type {RaceResult[]}
         */
        this.results = [];
    }

    load(tier, object) {
        this.tier = tier;
        this.name = object.name;
        this.date = new Date(object.date);
        this.timezone = object.timezone;
        for (const resultObject of object.results) {
            const result = new RaceResult();
            result.load(tier, resultObject);
            this.results.push(result);
        }
        this.link = object.link;
    }

    toJSON() {
        const results = [];
        for (const result of this.results) {
            results.push(result.toJSON());
        }
        return {
            name: this.name,
            tier: this.tier.name,
            date: this.date.toISOString(),
            timezone: this.timezone,
            results,
            link: this.link,
        }
    }
}

module.exports = Race;