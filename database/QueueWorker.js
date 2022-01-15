const Database = require('./Database');

class QueueWorker {
    constructor(serverManager) {
        this.serverManager = serverManager;
        this.queue = [];

        setInterval(() => {
            if (this.queue.length) {
                Database.multipleRun(this.queue).then(() => {
                    this.clear();
                }).catch((err) => {
                    console.log(err);
                });
            }
        }, 1000 * 60 * 60 * 3);
    }

    addToQueue(query) {
        this.queue.push(query);
    }

    clear() {
        this.queue = [];
    }
}

module.exports = QueueWorker;