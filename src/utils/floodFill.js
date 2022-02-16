const { adjust } = require('./position');

/**
 * @template T
 * @param {import('./typedefs').Grid} grid
 * @param {{x: number, y: number}} pos
 * @param {function(import('./typedefs').Grid, number, number): ({return: (T|undefined)}|{continue: (boolean|undefined)}|undefined)} callback
 * @param {boolean} [wrap=false]
 * @return {T|undefined}
 */
module.exports = (grid, pos, callback, wrap = false) => {
    const queue = [ pos ];
    const visited = new Set();

    while (queue.length) {
        // Adjust for out-of-bounds
        const adjusted = adjust(queue.shift(), grid, wrap);
        if (!adjusted) continue;
        const { x, y } = adjusted;

        // Handle visited
        if (visited.has(`${x},${y}`)) continue;
        visited.add(`${x},${y}`);

        // Run callback, return if value
        const res = callback(grid, x, y);
        if (res !== undefined) {
            if (res.return !== undefined) return res.return;
            if (res.continue !== undefined) continue;
        }

        // Add neighbors
        queue.push({ x: x - 1, y }, { x: x + 1, y }, { x, y: y - 1 }, { x, y: y + 1 });
    }
};
