const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
    id: {
        type: mongoose.SchemaTypes.String,
        required: true,
        unique: true,
    },
    log: {
        type: mongoose.SchemaTypes.String,
        required: true,
        unique: true,
        default: '0',
    },
    prefix: {
        type: mongoose.SchemaTypes.String,
        required: true,
        unique: false,
        default: '-',
    },
    tickets: {
        type: mongoose.SchemaTypes.String,
        required: true,
        unique: false,
        default: '0'
    }
});

module.exports = mongoose.model('server', serverSchema);