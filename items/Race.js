const QualiResult = require("./QualiResult");
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

        /**
         * @type {QualiResult[]}
         */
        this.qualifying = [];
    }

    load(tier, object) {
        this.tier = tier;
        this.name = object.name;
        this.date = new Date(object.date);
        this.timezone = object.timezone;
        this.link = object.link;
        for (const resultObject of object.results) {
            const result = new RaceResult();
            result.load(tier, resultObject);
            this.results.push(result);
        }
        this.results.sort((a, b) => a.position - b.position);
        if (object.qualifying) {
            for (const qualiObject of object.qualifying) {
                const result = new QualiResult();
                result.load(tier, qualiObject);
                this.qualifying.push(result);
            }
            this.qualifying.sort((a, b) => a.position - b.position);
        }
    }

    toJSON() {
        const results = [];
        for (const result of this.results) {
            results.push(result.toJSON());
        }
        const qualifying = [];
        for (const quali of this.qualifying) {
            qualifying.push(quali.toJSON());
        }
        return {
            name: this.name,
            tier: this.tier.name,
            date: this.date.toISOString(),
            timezone: this.timezone,
            results,
            qualifying,
            link: this.link,
        }
    }
}

module.exports = Race;