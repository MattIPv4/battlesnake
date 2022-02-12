const { logLevels } = require('./enums');

module.exports = (level, ...args) => {
    if (level < logLevels.warn && process.env.SNAKE_DEBUG !== 'true') return;

    switch (level) {
        case logLevels.debug:
            console.log(...args);
            break;
        case logLevels.warn:
            console.warn(...args);
            break;
        case logLevels.error:
            console.error(...args);
            break;
    }
};
