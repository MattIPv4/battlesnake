const logLevels = {};
logLevels[logLevels.debug = 0] = 'debug';
logLevels[logLevels.warn = 1] = 'warn';
logLevels[logLevels.error = 2] = 'error';

const cellLevels = {};
cellLevels[cellLevels.hazard = -2] = 'hazard';
cellLevels[cellLevels.snake = -1] = 'snake';
cellLevels[cellLevels.empty = 0] = 'empty';
cellLevels[cellLevels.food = 1] = 'food';

module.exports = {
  logLevels,
  cellLevels,
};
