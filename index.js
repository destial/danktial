require('dotenv').config();
const { ShardingManager } = require('discord.js');
const formatFormalTime = require('./utils/formatFormatTime');

const shards = new ShardingManager('./bot.js', {
    totalShards: 'auto'
});

shards.on('shardCreate', shard => {
    console.log(`[${formatFormalTime(new Date(), 'SGT')}] Started up shard ${shard.id}`);
});

shards.spawn(shards.totalShards);

process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'Reason:', reason);
});