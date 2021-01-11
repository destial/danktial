const sql = require('sqlite3');

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

            database.run('CREATE TABLE IF NOT EXISTS drivers (id VARCHAR(32), guild VARCHAR(32), number VARCHAR(3), reserved INT, team VARCHAR(32), tier VARCHAR(32))');
            database.run('CREATE TABLE IF NOT EXISTS advancedattendance (id VARCHAR(32) PRIMARY KEY, date VARCHAR(20), channel VARCHAR(32), tier VARCHAR(32))');
            database.run('CREATE TABLE IF NOT EXISTS tiers (guild VARCHAR(32), name VARCHAR(32))');
            database.run('CREATE TABLE IF NOT EXISTS teams (guild VARCHAR(32), name VARCHAR(32), tier VARCHAR(32))');
        });
        return database;
    }

    /**
     * `DELETE FROM teams WHERE (guild=(?) AND name=(?) AND tier=(?))`
     */
    static get teamDeleteQuery() { return "DELETE FROM teams WHERE (guild=(?) AND name=(?) AND tier=(?))"; }

    /**
     * `UPDATE teams SET guild=(?), name=(?), tier=(?) WHERE (guild=(?) AND tier=(?))`
     */
    static get teamUpdateQuery() { return "UPDATE teams SET guild=(?), name=(?), tier=(?) WHERE (guild=(?) AND tier=(?))"; }

    /**
     * `UPDATE drivers SET reserved=(?), team=(?), tier=(?) WHERE (id=(?) AND guild=(?) AND number=(?))`
     */
    static get driverUpdateQuery() { return "UPDATE drivers SET reserved=(?), team=(?), tier=(?) WHERE (id=(?) AND guild=(?) AND number=(?))"; }

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
     * `DELETE FROM advancedattendance WHERE id=(?)`
     */
    static get advancedAttendanceDeleteQuery() { return "DELETE FROM advancedattendance WHERE (id=(?))"; }

    /**
     * `DELETE FROM drivers WHERE (id=(?) AND guild=(?) AND tier=(?))`
     */
    static get driversDeleteQuery() { return "DELETE FROM drivers WHERE (id=(?) AND guild=(?) AND tier=(?))"; }

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
                    Database.db().close();
                    reject(err);
                } else {
                    Database.db().close();
                    resolve(true);
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
                    Database.db().close();
                    resolve(rows);
                } else {
                    Database.db().close();
                    reject(err);
                }
            });
        });
    }
}

module.exports = Database;