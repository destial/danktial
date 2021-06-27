const Driver = require("./Driver");
const Team = require("./Team");
const Tier = require("./Tier");

class RaceResult {

    /**
     * 
     * @param {Tier} tier 
     * @param {Driver} driver 
     * @param {number} gap 
     * @param {number} points 
     * @param {number} stops 
     * @param {number} penalties 
     * @param {number} position
     */
    constructor(tier, driver, position, gap, points, stops, penalties) {
        this.position = position;
        this.tier = tier;
        this.driver = driver;
        this.gap = gap;
        this.points = points;
        this.stops = stops;
        this.penalties = penalties;
    }

    /**
     * 
     * @param {Tier} tier 
     * @param {any} object 
     */
    load(tier, object) {
        this.tier = tier;
        this.driver = tier.getDriver(object.driver.id);
        if (!this.driver) {
            this.driver = {
                id: object.driver.id,
                name: object.driver.name,
                team: {
                    name: object.driver.team
                },
            }
        }
        this.gap = object.gap;
        this.stops = object.stops;
        this.penalties = object.penalties;
        this.points = object.points;
        this.position = object.position;
    }

    toJSON() {
        return {
            tier: this.tier.name,
            driver: {
                id: this.driver.id,
                name: this.driver.name,
                team: this.driver.team.name,
            },
            position: this.position,
            gap: this.gap,
            points: this.points,
            stops: this.stops,
            penalties: this.penalties,
        }
    }
};

module.exports = RaceResult;