const Driver = require("./Driver");
const Tier = require("./Tier");

class QualiResult {
    /**
     * 
     * @param {Tier} tier 
     * @param {Driver} driver 
     * @param {number} time 
     * @param {number} position
     */
     constructor(tier, driver, position, time) {
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
        this.time = time
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
            this.time = object.time;
            this.position = object.position;
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
            time: this.time,
        }
    }
}

module.exports = QualiResult;