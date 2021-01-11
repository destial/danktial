const Discord = require('discord.js');
/**
 * @param {string} string
 * @returns {string} thumbnail url
 */
function formatTrack(string) {
    const countries = ['australia', 'bahrain', 'china', 'azerbaijan', 'spain', 'monaco', 'canada', 
                        'france', 'austria', 'great britain', 'hungary', 'belgium', 'italy', 'singapore', 
                        'russia', 'japan', 'mexico', 'united states', 'brazil', 'abu dhabi'];

    const countryAlias = new Discord.Collection();
    countryAlias.set('melbourne', 'australia');
    countryAlias.set('baku', 'azerbaijan');
    countryAlias.set('chinese', 'china');
    countryAlias.set('shanghai', 'china');
    countryAlias.set('spanish', 'spain');
    countryAlias.set('barcelona', 'spain');
    countryAlias.set('canadian', 'canada');
    countryAlias.set('montreal', 'canada');
    countryAlias.set('french', 'france');
    countryAlias.set('paul ricard', 'france');
    countryAlias.set('british', 'great britain');
    countryAlias.set('britain', 'great britain');
    countryAlias.set('silverstone', 'great britain');
    countryAlias.set('spa francorshamp', 'belgium');
    countryAlias.set('spa-francorshamp', 'belgium');
    countryAlias.set('marina bay', 'singapore');
    countryAlias.set('monza', 'italy');
    countryAlias.set('suzuka', 'japan');
    countryAlias.set('mexican', 'mexico');
    countryAlias.set('usa', 'united states');
    countryAlias.set('america', 'united states');
    countryAlias.set('american', 'united states');
    countryAlias.set('sao paolo', 'brazil');
    countryAlias.set('yas marina', 'abu dhabi');

    const thumbnailUrl = 'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/Flags%2016x9/{COUNTRY}-flag.png.transform/2col/image.png';

    const country = countries.find(country => string.toLowerCase().includes(country));
    if (country) {
        return thumbnailUrl.replace('{COUNTRY}', country.replace(' ', '-'));
    } else {
        const aliasArray = countryAlias.keyArray();
        const alias = aliasArray.find(alias => string.toLowerCase().includes(alias));
        if (alias) {
            const c = countryAlias.get(alias);
            return thumbnailUrl.replace('{COUNTRY}', c.replace(' ', '-'));
        }
        return undefined;
    }
}

module.exports = formatTrack;