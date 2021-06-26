const Driver = require("./Driver");
const Tier = require("./Tier");

class QualiResult {
    /**
     * 
     * @param {Tier} tier 
     * @param {Driver} driver 
     * @param {number} gap 
     * @param {number} position
     */
     constructor(tier, driver, position) {
        this.position = position;
        this.tier = tier;
        this.driver = driver;
        this.gap = gap;
    }

    /**
     * 
     * @param {Tier} tier 
     * @param {any} object 
     */
    load(tier, object) {
        this.tier = tier;
        this.driver = tier.getDriver(object.driver.id);
        this.gap = object.gap;
        this.position = object.position;
    }

    toJSON() {
        return {
            tier: this.tier.name,
            driver: this.driver.toJSON(),
            position: this.position,
            gap: this.gap,
        }
    }
}

module.exports = QualiResult;