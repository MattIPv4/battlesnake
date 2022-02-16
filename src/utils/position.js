/**
 * @template {{x: number, y: number}} T
 * @param {T} pos
 * @param {import('./typedefs').Grid} grid
 * @param {boolean} [wrap=false]
 * @return {?T}
 */
const adjust = (pos, grid, wrap = false) => {
    let { x, y } = pos;

    // If standard, avoid out-of-bounds
    if (!wrap && (x < 0 || x >= grid.length || y < 0 || y >= grid[0].length)) return null;

    // Adjust out-of-bounds
    if (x < 0) x = grid.length - 1;
    if (x >= grid.length) x = 0;
    if (y < 0) y = grid[0].length - 1;
    if (y >= grid[0].length) y = 0;

    return { ...pos, x, y };
};

/**
 * @param {{x: number, y: number}} pos
 * @return {import('./typedefs').Movement[]}
 */
const surrounding = pos => ([
    { x: pos.x + 1, y: pos.y, move: 'right' },
    { x: pos.x - 1, y: pos.y, move: 'left' },
    { x: pos.x, y: pos.y + 1, move: 'up' },
    { x: pos.x, y: pos.y - 1, move: 'down' },
]);

module.exports = {
    adjust,
    surrounding,
};
