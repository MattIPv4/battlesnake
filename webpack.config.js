const path = require('path');

module.exports = {
    mode: 'none',
    target: 'webworker',
    entry: './src/index.js',
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'worker.js',
    },
};
