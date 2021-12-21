const Driver = require("./Driver");
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
    constructor(tier, driver, position, gap, points, stops, penalties, scoringteam) {
        this.position = position;
        this.tier = tier;
        this.driver = undefined;
        if (driver) {
            this.driver = {
                id: driver.id,
                name: driver.name,
                team: {
                    name: driver.team ? driver.team.name : "Reserve"
                },
            }
        }
        this.gap = gap;
        this.points = points;
        this.stops = stops;
        this.penalties = penalties;
        this.scoringteam = scoringteam;
    }

    /**
     * 
     * @param {Tier} tier 
     * @param {any} object 
     */
    load(tier, object) {
        try {
            this.tier = tier;
            this.driver = {
                id: object.driver.id,
                name: object.driver.name,
                team: {
                    name: object.driver.team ? object.driver.team : "Reserve"
                },
            }
            this.gap = object.gap;
            this.stops = object.stops;
            this.penalties = object.penalties;
            this.points = object.points;
            this.position = object.position;
            this.scoringteam = !object.scoringteam ? this.driver.team.name : object.scoringteam;
        } catch(err) {
            console.log(err);
        }
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
            scoringteam: this.scoringteam,
        }
    }
};

module.exports = RaceResult;