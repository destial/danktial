const { Collection } = require('discord.js');
/**
 * @param {string} string
 * @returns {string | undefined} thumbnail url
 */
function formatTrack(string) {
    const countries = ['australia', 'bahrain', 'china', 'azerbaijan', 'vietnam', 'spain', 'netherlands', 'monaco', 'canada', 
                        'france', 'austria', 'great britain', 'hungary', 'belgium', 'italy', 'singapore', 
                        'russia', 'japan', 'mexico', 'united states', 'brazil', 'abu dhabi', 'saudi arabia'];

    /**
     * @type {Collection<string, string>}
     */
    const countryAlias = new Collection();
    countryAlias.set('melbourne', 'australia');
    countryAlias.set('albert park', 'australia');
    countryAlias.set('baku', 'azerbaijan');
    countryAlias.set('hanoi', 'vietnam');
    countryAlias.set('chinese', 'china');
    countryAlias.set('shanghai', 'china');
    countryAlias.set('spanish', 'spain');
    countryAlias.set('spaniard', 'spain');
    countryAlias.set('barcelona', 'spain');
    countryAlias.set('canadian', 'canada');
    countryAlias.set('montreal', 'canada');
    countryAlias.set('zandvoort', 'netherlands');
    countryAlias.set('dutch', 'netherlands');
    countryAlias.set('french', 'france');
    countryAlias.set('styrian', 'austria');
    countryAlias.set('redbull ring', 'austria');
    countryAlias.set('paul ricard', 'france');
    countryAlias.set('british', 'great britain');
    countryAlias.set('britain', 'great britain');
    countryAlias.set('silverstone', 'great britain');
    countryAlias.set('spa francorshamp', 'belgium');
    countryAlias.set('spafrancorshamp', 'belgium');
    countryAlias.set('spa-francorshamp', 'belgium');
    countryAlias.set('belgian', 'belgium');
    countryAlias.set('marina bay', 'singapore');
    countryAlias.set('monza', 'italy');
    countryAlias.set('italian', 'italy');
    countryAlias.set('suzuka', 'japan');
    countryAlias.set('mexican', 'mexico');
    countryAlias.set('usa', 'united states');
    countryAlias.set('america', 'united states');
    countryAlias.set('sao paolo', 'brazil');
    countryAlias.set('yas marina', 'abu dhabi');
    countryAlias.set('arabian', 'saudi arabia');

    const thumbnailUrl = 'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/Flags%2016x9/{COUNTRY}-flag.png.transform/2col/image.png';

    const country = countries.find(c => string.toLowerCase().includes(c));
    if (country) {
        return thumbnailUrl.replace('{COUNTRY}', country.replace(' ', '-'));
    } else {
        const aliasArray = countryAlias.keyArray();
        const alias = aliasArray.find(a => string.toLowerCase().includes(a));
        if (alias) {
            const c = countryAlias.get(alias);
            return thumbnailUrl.replace('{COUNTRY}', c.replace(' ', '-'));
        }
        return undefined;
    }
}

module.exports = formatTrack;