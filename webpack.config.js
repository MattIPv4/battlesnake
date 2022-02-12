const path = require('path');
const { EnvironmentPlugin } = require('webpack');

module.exports = {
    mode: 'none',
    target: 'webworker',
    entry: './src/index.js',
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'worker.js',
    },
    plugins: [
        new EnvironmentPlugin({
            SNAKE_DEBUG: 'false',
        }),
    ],
};
