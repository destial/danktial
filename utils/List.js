const { Collection } = require('discord.js');
class List extends Collection {
    constructor(entries) {
        super(entries);
    }
    
    /**
     * Adds a key and value to the list if the key does not already exist.
     * @param {*} key 
     * @param {*} value 
     */
    add(key, value) {
        if (!super.has(key)) {
            return super.set(key, value);
        }
        return this;
    }

    /**
     * Removes all values that match from the list.
     * @param {*} value Value to remove
     */
    remove(value) {
        var _deleted = false;
        super.keyArray().forEach(key => {
            if (super.get(key) === value) {
                super.delete(key);
                _deleted = true;
            }
        });
        return _deleted;
    }

    /**
     * Insert a value with its key in a specific position in the list.
     * @param {*} key The key to insert
     * @param {*} value The value to insert
     * @param {number} position The position to insert to
     */
    insert(key, value, position) {
        if (typeof position !== 'number' || 
            position > this.size || 
            this.size === 0) {
            return this.add(key, value);
        }
        position = parseInt(position);
        const size = this.size;
        const _keyArray = super.keyArray();
        const _valueArray = super.array();
        if (position < 1) {
            super.clear();
            super.set(key, value);
            for (let i = 0; i < size; ++i) {
                super.set(_keyArray[i], _valueArray[i]);
            }
            return this;
        }
        super.clear();
        for (let i = 0; i < size; ++i) {
            if (i === position-1) {
                super.set(key, value);
            }
            super.set(_keyArray[i], _valueArray[i]);
        }
        return this;
    }

    /**
     * Similar to Array.shift(). Returns the first value and removes it from the list.
     */
    shift() {
        if (this.size !== 0) {
            const first = super.first();
            super.delete(super.firstKey());
            return first;
        }
        return undefined;
    }

    /**
     * Similar to Array.pop(). Returns the last value and removes it from the list.
     */
    pop() {
        if (this.size !== 0) {
            const last = super.last();
            super.delete(super.lastKey());
            return last;
        }
        return undefined;
    }
}

module.exports = List;