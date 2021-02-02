const { timezones } = require('./timezones');

/**
* Converts a date with the format `DD/MM/YYYY HH:MM TMZE` to a Date object
* @param {string} date "DD/MM/YYYY HH:MM TMZE"
* @returns {Promise<Date>}
*/
async function formatDate(date) {
   var month, day, year, hour, minute, difference;
   const months = ["placeholder", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

   const d = date.trim();
   day = d.substr(0, 2);
   month = months[d.substr(3, 2).startsWith("0") ? d.substr(4, 1) : d.substr(3, 2)];
   year = d.substr(6, 4);
   hour = d.substr(11, 2);
   minute = d.substr(14,2);

   const key = timezones.keyArray().find(t => d.toUpperCase().endsWith(t));
   difference = timezones.get(key);
   if (!difference) difference = "+00";
   const promise = new Promise(async function(resolve, reject) {
       const dateObject = new Date(`${month} ${day}, ${year} ${hour}:${minute}:00 UTC ${difference}:00`);
       if (Object.prototype.toString.call(dateObject) === "[object Date]") {
           if (isNaN(dateObject.getTime())) {
               reject(dateObject);
           } else {
               resolve(dateObject);
           }
       } else {
           reject(dateObject);
       }
   });
   return promise;
}

module.exports = formatDate;