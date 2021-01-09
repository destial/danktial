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
        });
        return database;
    }

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
                    reject(false);
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
                    reject([]);
                }
            });
        });
    }
}

module.exports = Database;