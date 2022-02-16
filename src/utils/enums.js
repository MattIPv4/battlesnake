const logLevels = {};
logLevels[logLevels.debug = 0] = 'debug';
logLevels[logLevels.warn = 1] = 'warn';
logLevels[logLevels.error = 2] = 'error';

module.exports = {
  logLevels,
};
