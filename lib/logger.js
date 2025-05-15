var fs = require('fs');
var chalk = require('chalk'); // Import chalk
// var settings = require('./config/app/settings.json'); // Removed unused variable

// Utility functions for date formatting
function getMonthFormatted(date) {
    var month = date.getMonth() + 1;
    return month < 10 ? '0' + month : '' + month;
}

function getMonthFormattedString(date) {
    switch (date.getMonth()) {
        case 0: return "Jan";
        case 1: return "Feb";
        case 2: return "Mar";
        case 3: return "Apr";
        case 4: return "May";
        case 5: return "Jun";
        case 6: return "Jul";
        case 7: return "Aug";
        case 8: return "Sep";
        case 9: return "Oct";
        case 10: return "Nov";
        case 11: return "Dec";
    }
    var month = date.getMonth() + 1; 
    return month < 10 ? '0' + month : '' + month;
}

function getDayFormatted(date) {
    var day = date.getDate();
    return day < 10 ? '0' + day : '' + day;
}

function getHourFormatted(date) {
    var hour = date.getHours();
    return hour < 10 ? '0' + hour : '' + hour;
}

function getMinuteFormatted(date) {
    var minute = date.getMinutes();
    return minute < 10 ? '0' + minute : '' + minute;
}

function getSecondFormatted(date) {
    var second = date.getSeconds();
    return second < 10 ? '0' + second : '' + second;
}

function getFormattedDateTime(date) {
    return getDayFormatted(date) + '/' + getMonthFormatted(date) + '/' + date.getFullYear() + " " + 
           getHourFormatted(date) + ":" + getMinuteFormatted(date) + ":" + getSecondFormatted(date);
}

function getDateTimeFormatted(date) {
    return `${getMonthFormattedString(date)} ${getDayFormatted(date)} ${date.getFullYear()} ${getHourFormatted(date)}:${getMinuteFormatted(date)}:${getSecondFormatted(date)}`;
}

var dir = process.cwd() + '/logs';

// Function to generate the log file name dynamically
function getLogFileName() {
    var d = new Date(); // This will use the mocked Date during tests
    var todaysDate = getDayFormatted(d) + '' + getMonthFormatted(d) + '' + d.getFullYear();
    return dir + "/debug_" + todaysDate + ".txt";
}

var initMessage = "============================================\nInitialized logger\n==================================================\n";

module.exports.init = function () {
    console.info(chalk.green("logger module initialized successfully!")); // Use chalk for color
    const currentLogFileName = getLogFileName(); // Get filename when init is called
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    if(!fs.existsSync(currentLogFileName)){
        fs.appendFile(currentLogFileName, initMessage, function (err) {
            if (err) {
               // console.error("Error writing init message to log: ", err);
            }
        });
    } else {
        let message = "============================================\n RUN the application on " + getDateTimeFormatted(new Date()) + "\n==================================================\n";
        fs.appendFile(currentLogFileName, message, function (err) {
            if (err) {
                // console.error("Error writing run message to log: ", err);
            }
        });
    }
}

module.exports.logFile = function(logMessage){
    const currentLogFileName = getLogFileName(); // Get filename when logFile is called
    let messageToLog;
    const timestamp = getDateTimeFormatted(new Date());
    let formattedMessage;

    if (typeof logMessage === 'object' && logMessage !== null) {
        formattedMessage = JSON.stringify(logMessage, null, 2);
    } else {
        formattedMessage = String(logMessage);
    }
    
    messageToLog = `[${timestamp}] ${formattedMessage} \n`;
    
    fs.appendFile(currentLogFileName, messageToLog, function (err) {
        if (err) {
           // console.error("Error writing to log file: ", err);
        }
    });
}

// Export utility functions for testing
module.exports.formatDateUtils = {
    getMonthFormatted,
    getMonthFormattedString,
    getDayFormatted,
    getHourFormatted,
    getMinuteFormatted,
    getSecondFormatted,
    getFormattedDateTime,
    getDateTimeFormatted
};