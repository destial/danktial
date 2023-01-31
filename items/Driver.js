class Driver {
    constructor(client, member, server, team, number, tier) {
        this.client = client;
        this.member = member;
        this.id = member.id;
        this.server = server;
        this.guild = member.guild;
        this.team = team;
        this.number = number || '0';
        this.name = member.displayName;
        this.tier = tier;
    }

    async save() {
        this.server.update();
    }

    async update() {
        this.server.update();
    }

    async updateReserve() {
        this.server.update();
    }

    /**
     * 
     * @param {string} number 
     */
    async updateNum(number) {
        this.setNumber(number);
    }

    async delete() {

    }

    setTeam(team) {
        this.team = team;
    }

    setNumber(number) {
        this.number = number;
    }

    setTier(tier) {
        this.tier = tier;
    }

    toFullName() {
        return `#${this.number} - ${this.member}`;
    }

    async toReserve() {
        this.tier.removeDriver(this.id);
        this.team = undefined;
        this.updateReserve();
        return this;
    }

    async toDriver(team) {
        this.team = team;
        this.tier.removeReserve(this.id);
        this.tier.addDriver(this);
        team.setDriver(this);
        this.update();
        return this;
    }

    toJSON() {
        return {
            id: this.id,
            guild: this.guild.id,
            number: this.number,
            name: this.member.displayName,
            team: (this.team ? this.team.name : null),
            tier: this.tier.name,
            reserved: false
        };
    }

    toString() {
        return `${this.member}`;
    }

    async DM(object) {
        return await this.member.user.send(object);
    }
}

module.exports = Driver;