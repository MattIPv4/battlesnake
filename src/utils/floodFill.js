module.exports = (grid, pos, callback, wrap = false) => {
    const queue = [ pos ];
    const visited = new Set();

    while (queue.length) {
        let { x, y } = queue.shift();

        // If standard, ignore out-of-bounds
        if (!wrap && (x < 0 || x >= grid.length || y < 0 || y >= grid[0].length)) continue;

        // If wrap, adjust out-of-bounds
        if (wrap) {
            if (x < 0) x = grid.length - 1;
            if (x >= grid.length) x = 0;
            if (y < 0) y = grid[0].length - 1;
            if (y >= grid[0].length) y = 0;
        }

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
