module.exports = {
    info: (...args) => process.env.SNAKE_DEBUG === 'true' && console.info(...args),
    warn: (...args) => console.warn(...args),
    error: (...args) => console.error(...args),
};
