/**
* Converts a date with the format `DD/MM/YYYY HH:MM TMZE` to a Date object
* @param {string} date "DD/MM/YYYY HH:MM AEDT"; 
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

   if (date.endsWith("AEDT")) difference = "+11";
   else if (date.endsWith("SGT")) difference = "+8";
   else if (date.endsWith("AEST")) difference = "+10";
   else difference = "+00";
   const promise = new Promise(async function(resolve, reject) {
       const dateObject = new Date(`${month} ${day}, ${year} ${hour}:${minute}:00 GMT ${difference}:00`);
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