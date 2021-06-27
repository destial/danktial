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
        this.driver = driver;
        this.time = time
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
        this.time = object.time;
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
            time: this.time,
        }
    }
}

module.exports = QualiResult;