const ServerManager = require('../managers/ServerManager');
const Database = require('./Database');
const Query = require('./Query');


class QueueWorker {
    /**
     * 
     * @param {ServerManager} serverManager 
     */
    constructor(serverManager) {
        this.serverManager = serverManager;
        /**
         * @type {Query[]}
         */
        this.queue = [];

        setInterval(() => {
            Database.multipleRun(this.queue).then(() => {
                delete this.queue;
                this.queue = [];
            }).catch((err) => {
                console.log(err);
            });
        }, 1000 * 60 * 60 * 3);
    }

    /**
     * 
     * @param {Query} query 
     */
    addToQueue(query) {
        this.queue.push(query);
    }

    clear() {
        delete this.queue;
    }
}

module.exports = QueueWorker;