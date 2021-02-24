const sql = require('sqlite3');
const Query = require('./Query');
const { Collection } = require('discord.js');

class Database {
    static db() {
        let database = new sql.Database('./bot.db', (err) => {
            if (err) {
              console.log(err.message);
            }
            database.run('CREATE TABLE IF NOT EXISTS servers (id VARCHAR(32) PRIMARY KEY, prefix VARCHAR(3), tickets INT, log VARCHAR(32))');
            database.run('CREATE TABLE IF NOT EXISTS tickets (id VARCHAR(32) PRIMARY KEY, member VARCHAR(32), number INT, base VARCHAR(32))');
            database.run('CREATE TABLE IF NOT EXISTS ticketpanel (id VARCHAR(32) PRIMARY KEY, channel VARCHAR(32))');
            database.run('CREATE TABLE IF NOT EXISTS attendance (id VARCHAR(32) PRIMARY KEY, date VARCHAR(20), channel VARCHAR(32))');
            database.run('CREATE TABLE IF NOT EXISTS count (id VARCHAR(32) PRIMARY KEY, name VARCHAR(16))');

            database.run('CREATE TABLE IF NOT EXISTS drivers (id VARCHAR(32), guild VARCHAR(32), number VARCHAR(3), reserved INT, team VARCHAR(32), tier VARCHAR(255))');
            database.run('CREATE TABLE IF NOT EXISTS advancedattendance (id VARCHAR(32) PRIMARY KEY, date VARCHAR(20), channel VARCHAR(32), tier VARCHAR(255))');
            database.run('CREATE TABLE IF NOT EXISTS tiers (guild VARCHAR(32), name VARCHAR(255))');
            database.run('CREATE TABLE IF NOT EXISTS teams (guild VARCHAR(32), name VARCHAR(255), tier VARCHAR(255))');
            database.run('CREATE TABLE IF NOT EXISTS triggers (guild VARCHAR(32), trigger VARCHAR(255), response VARCHAR(255))');
            database.run('CREATE TABLE IF NOT EXISTS reactionrolepanels (id VARCHAR(32) PRIMARY KEY, channel VARCHAR(32))');
            database.run('CREATE TABLE IF NOT EXISTS reactionroles (guild VARCHAR(32), panel VARCHAR(32), emoji VARCHAR(32), role VARCHAR(32))');

            database.run('CREATE TABLE IF NOT EXISTS serverembeds (id VARCHAR(32) PRIMARY KEY, data VARCHAR(2024))');

            database.run('CREATE TABLE IF NOT EXISTS serverdata (id VARCHAR(32) PRIMARY KEY, data VARCHAR(2048))');
        });
        return database;
    }

    /**
     * `REPLACE INTO serverdata (id,data) VALUES (?,?)`
     */
    static get serverDataUpdateQuery() { return "REPLACE INTO serverdata (id,data) VALUES (?,?)"; }

    /**
     * `DELETE FROM serverdata WHERE id=(?)`
     */
    static get serverDataDeleteQuery() { return "DELETE FROM serverdata WHERE id=(?)"; }

    /**
     * `UPDATE serverdata SET data=(?) WHERE id=(?)`
     */
    static get serverDataSaveQuery() { return "UPDATE serverdata SET data=(?) WHERE id=(?)"; }

    /**
     * `SELECT * FROM serverdata`
     */
    static get serverDataQuery() { return "SELECT * FROM serverdata"; }

    /**
     * `DELETE FROM serverembeds WHERE id=(?)`
     */
    static get serverEmbedDeleteQuery() { return "DELETE FROM serverembeds WHERE id=(?)"; }

    /**
     * `REPLACE INTO serverembeds (id,data) VALUES (?,?)`
     */
    static get serverEmbedSaveQuery() { return "REPLACE INTO serverembeds (id,data) VALUES (?,?)"; }

    /**
     * `SELECT * FROM serverembeds`
     */
    static get serverEmbedQuery() { return "SELECT * FROM serverembeds"; }

    /**
     * `DELETE FROM reactionrolepanels WHERE id=(?)`
     */
    static get reactionRolePanelDeleteQuery() { return "DELETE FROM reactionrolepanels WHERE id=(?)"; }

    /**
     * `DELETE FROM reactionroles WHERE guild=(?)`
     */
    static get reactionRoleDeleteGuildQuery() { return "DELETE FROM reactionroles WHERE guild=(?)"; }

    /**
     * `DELETE FROM reactionroles WHERE (guild=(?) AND panel=(?) AND emoji=(?) AND role=(?))`
     */
    static get reactionRoleDeleteQuery() { return "DELETE FROM reactionroles WHERE (guild=(?) AND panel=(?) AND emoji=(?) AND role=(?))"; }

    /**
     * `REPLACE INTO reactionrolepanels (id,channel) VALUES (?,?)`
     */
    static get reactionRolePanelUpdateQuery() { return "REPLACE INTO reactionrolepanels (id,channel) VALUES (?,?)"; }

    /**
     * `UPDATE reactionroles SET role=(?) WHERE (guild=(?) AND panel=(?) AND emoji=(?) AND role=(?)`
     */
    static get reactionRoleUpdateRoleQuery() { return "UPDATE reactionroles SET role=(?) WHERE (guild=(?) AND panel=(?) AND emoji=(?) AND role=(?))"; }

    /**
     * `UPDATE reactionroles SET emoji=(?) WHERE (guild=(?) AND panel=(?) AND emoji=(?) AND role=(?)`
     */
    static get reactionRoleUpdateEmojiQuery() { return "UPDATE reactionroles SET emoji=(?) WHERE (guild=(?) AND panel=(?) AND emoji=(?) AND role=(?))"; }

    /**
     * `INSERT INTO reactionrolepanel (id,channel) VALUES (?,?)`
     */
    static get reactionRolePanelSaveQuery() { return "INSERT INTO reactionrolepanels (id,channel) VALUES (?,?)"; }

    /**
     * `INSERT INTO reactionroles (guild,panel,emoji,role) VALUES (?,?,?,?)`
     */
    static get reactionRoleSaveQuery() { return "INSERT INTO reactionroles (guild,panel,emoji,role) VALUES (?,?,?,?)"; }

    /**
     * `SELECT * FROM reactionrolepanels`
     */
    static get reactionRolePanelQuery() { return "SELECT * FROM reactionrolepanels"; }

    /**
     * `SELECT * FROM reactionroles`
     */
    static get reactionRoleQuery() { return "SELECT * FROM reactionroles"; }

    /**
     * `DELETE FROM triggers WHERE guild=(?)`
     */
    static get triggerDeleteGuildQuery() { return "DELETE FROM triggers WHERE guild=(?)"; }

    /**
     * `DELETE FROM triggers WHERE (guild=(?) AND trigger=(?) AND response=(?))`
     */
    static get triggerDeleteQuery() { return "DELETE FROM triggers WHERE (guild=(?) AND trigger=(?) AND response=(?))"; }

    /**
     * `UPDATE triggers SET response=(?) WHERE (guild=(?) AND trigger=(?) AND response=(?))`
     */
    static get triggerUpdateResponseQuery() { return "UPDATE triggers SET response=(?) WHERE (guild=(?) AND trigger=(?) AND response=(?))"; }

    /**
     * `UPDATE triggers SET trigger=(?) WHERE (guild=(?) AND trigger=(?) AND response=(?))`
     */
    static get triggerUpdateTriggerQuery() { return "UPDATE triggers SET trigger=(?) WHERE (guild=(?) AND trigger=(?) AND response=(?))"; }

    /**
     * `INSERT INTO triggers (guild,trigger,response) VALUES (?,?,?)`
     */
    static get triggerSaveQuery() { return "INSERT INTO triggers (guild,trigger,response) VALUES (?,?,?)"; }

    /**
     * `SELECT * FROM triggers`
     */
    static get triggerQuery() { return "SELECT * FROM triggers"; }

    /**
     * `DELETE FROM teams WHERE (guild=(?) AND name=(?) AND tier=(?))`
     */
    static get teamDeleteQuery() { return "DELETE FROM teams WHERE (guild=(?) AND name=(?) AND tier=(?))"; }

    /**
     * `DELETE FROM teams WHERE guild=(?)`
     */
    static get teamDeleteGuildQuery() { return "DELETE FROM teams WHERE guild=(?)"; }

    /**
     * `UPDATE teams SET guild=(?), name=(?), tier=(?) WHERE (guild=(?) AND name=(?) AND tier=(?))`
     */
    static get teamUpdateQuery() { return "UPDATE teams SET guild=(?), name=(?), tier=(?) WHERE (guild=(?) AND name=(?) AND tier=(?))"; }

    /**
     * `UPDATE teams SET name=(?) WHERE (guild=(?) AND name(?) AND tier=(?))`
     */
    static get teamUpdateNameQuery() { return "UPDATE teams SET name=(?) WHERE (guild=(?) AND name=(?) AND tier=(?))"; }

    /**
     * `UPDATE drivers SET reserved=(?), team=(?) WHERE (id=(?) AND guild=(?) AND number=(?) AND tier=(?))`
     */
    static get driverUpdateQuery() { return "UPDATE drivers SET reserved=(?), team=(?) WHERE (id=(?) AND guild=(?) AND number=(?) AND tier=(?))"; }

    /**
     * `UPDATE drivers SET number=(?) WHERE (id=(?) AND guild=(?))`
     */
    static get driverUpdateNumberQuery() { return "UPDATE drivers SET number=(?) WHERE (id=(?) AND guild=(?))"; }

    /**
     * `UPDATE tiers SET name=(?) WHERE (guild=(?) AND name=(?))`
     */
    static get tierUpdateQuery() { return "UPDATE tiers SET name=(?) WHERE (guild=(?) AND name=(?))"; }

    /**
     * `INSERT INTO teams (guild,name,tier) VALUES (?,?,?)`
     */
    static get teamSaveQuery() { return "INSERT INTO teams (guild,name,tier) VALUES (?,?,?)"; }

    /**
     * `SELECT * FROM teams`
     */
    static get teamQuery() { return "SELECT * FROM teams"; }

    /**
     * `DELETE FROM advancedattendance WHERE (guild=(?) AND name=(?))`
     */
    static get tierDeleteQuery() { return "DELETE FROM tiers WHERE (guild=(?) AND name=(?))"; }

    /**
     * `DELETE FROM tiers WHERE guild=(?)`
     */
    static get tierDeleteGuildQuery() { return "DELETE FROM tiers WHERE guild=(?)"; }

    /**
     * `DELETE FROM advancedattendance WHERE id=(?)`
     */
    static get advancedAttendanceDeleteQuery() { return "DELETE FROM advancedattendance WHERE (id=(?))"; }

    /**
     * `UPDATE advancedattendance SET date=(?) WHERE (id=(?) AND channel=(?))`
     */
    static get advancedAttendanceUpdateQuery() { return "UPDATE advancedattendance SET date=(?) WHERE (id=(?) AND channel=(?))"; }

    /**
     * `DELETE FROM drivers WHERE (id=(?) AND guild=(?) AND tier=(?))`
     */
    static get driversDeleteQuery() { return "DELETE FROM drivers WHERE (id=(?) AND guild=(?) AND tier=(?))"; }

    /**
     * `DELETE FROM drivers WHERE guild=(?)`
     */
    static get driversDeleteGuildQuery() { return "DELETE FROM drivers WHERE guild=(?)"; }

    /**
     * `INSERT INTO tiers (guild,name) VALUES (?,?)`
     */
    static get tierSaveQuery() { return "INSERT INTO tiers (guild,name) VALUES (?,?)"; }

    /**
     * `REPLACE INTO advancedattendance (id,date,channel,tier) VALUES (?,?,?,?)`
     */
    static get advancedAttendanceSaveQuery() { return "REPLACE INTO advancedattendance (id,date,channel,tier) VALUES (?,?,?,?)"; }

    /**
     * `INSERT INTO drivers (id,guild,number,reserved,team,tier) VALUES (?,?,?,?,?,?)`
     */
    static get driverSaveQuery() { return "INSERT INTO drivers (id,guild,number,reserved,team,tier) VALUES (?,?,?,?,?,?)"; }

    /**
     * `SELECT * FROM advancedattendance`
     */
    static get advancedAttendanceQuery() { return "SELECT * FROM advancedattendance"; }

    /**
     * `SELECT * FROM tiers`
     */
    static get tierQuery() { return "SELECT * FROM tiers"; }

    /**
     * `SELECT * FROM drivers`
     */
    static get driverQuery() { return "SELECT * FROM drivers"; }

    /**
     * `SELECT * FROM servers`
     */
    static get serverQuery() { return "SELECT * FROM servers"; }

    /**
     * `SELECT * FROM tickets`
     */
    static get ticketQuery() { return "SELECT * FROM tickets"; }

    /**
     * `SELECT * FROM ticketpanel`
     */
    static get ticketPanelQuery() { return "SELECT * FROM ticketpanel"; }

    /**
     * `SELECT * FROM attendance`
     */
    static get attendanceQuery() { return "SELECT * FROM attendance"; }

    /**
     * `SELECT * FROM count`
     */
    static get countQuery() { return "SELECT * FROM count"; }

    /**
     * `REPLACE INTO servers (id,prefix,tickets,log) VALUES (?,?,?,?)`
     */
    static get serverSaveQuery() { return "REPLACE INTO servers (id,prefix,tickets,log) VALUES (?,?,?,?)"; }

    /**
     * `DELETE FROM servers WHERE id=(?)`
     */
    static get serverDeleteQuery() { return "DELETE FROM servers WHERE id=(?)"; }

    /**
     * `REPLACE INTO tickets (id,member,number,base) VALUES (?,?,?,?)`
     */
    static get ticketSaveQuery() { return "REPLACE INTO tickets (id,member,number,base) VALUES (?,?,?,?)"; }

    /**
     * `DELETE FROM tickets WHERE id=(?)`
     */
    static get ticketDeleteQuery() { return "DELETE FROM tickets WHERE id=(?)"; }

    /**
     * `REPLACE INTO ticketpanel (id,channel) VALUES (?,?)`
     */
    static get ticketPanelSaveQuery() { return "REPLACE INTO ticketpanel (id,channel) VALUES (?,?)"; }

    /**
     * `DELETE FROM ticketpanel WHERE id=(?)`
     */
    static get ticketPanelDeleteQuery() { return "DELETE FROM ticketpanel WHERE id=(?)"; }

    /**
     * `REPLACE INTO attendance (id,schedule,channel) VALUES (?,?,?)`
     */
    static get attendanceSaveQuery() { return "REPLACE INTO attendance (id,date,channel) VALUES (?,?,?)"; }

    /**
     * `DELETE FROM attendance WHERE id=(?)`
     */
    static get attendanceDeleteQuery() { return "DELETE FROM attendance WHERE id=(?)"; }

    /**
     * `REPLACE INTO count (id,name) VALUES (?,?)`
     */
    static get countSaveQuery() { return "REPLACE INTO count (id,name) VALUES (?,?)"; }

    /**
     * `DELETE FROM count WHERE id=(?)`
     */
    static get countDeleteQuery() { return "DELETE FROM count WHERE id=(?)"; }

    /**
     * 
     * @param {string} query 
     * @param  {...string} args 
     * @return {Promise<boolean>}
     */
    static run(query, ...args) {
        return new Promise((resolve, reject) => {
            Database.db().run(query, ...args, err => {
                if (err) {
                    Database.db().close(er => {
                        reject(err);
                    });
                } else {
                    Database.db().close(err => {
                        resolve();
                    });
                }
            });
        });
    }

    /**
     * 
     * @param {string} query
     * @returns {Promise<any[]>} 
     */
    static all(query) {
        return new Promise((resolve, reject) => {
            Database.db().all(query, [], (err, rows) => {
                if (!err) {
                    Database.db().close(err => {
                        resolve(rows);
                    });
                } else {
                    Database.db().close(er => {
                        reject(err);
                    });
                }
            });
        });
    }

    /**
     * 
     * @param  {Query[]} queries
     */
    static multipleRun(queries) {
        return new Promise((resolve, reject) => {
            queries.forEach(query => {
                Database.db().run(query.query, query.args, err => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    console.log(`[DB] Ran ${query.query}`);
                });
            });
            Database.db().close(err => {
                resolve();
            });
        });
    }

    /**
     * 
     * @param  {Query[]} queries
     * @returns {Promise<Collection<Query, any[]>}
     */
    static multipleAll(queries) {
        /**
         * @type {Collection<Query, any[]>}
         */
        const collection = new Collection();
        return new Promise(async (resolve, reject) => {
            queries.forEach(query => {
                Database.db().all(query.query, query.args, (err, rows) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    } else {
                        console.log(`[DB] All ${query.query}`);
                        collection.set(query, rows);
                    }
                });
            });
            Database.db().close(err => {
                resolve(collection);
            });
        });
    }
}

module.exports = Database;