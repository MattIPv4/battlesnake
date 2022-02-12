const { cellLevels, logLevels } = require('./utils/enums');
const floodFill = require('./utils/floodFill');
const log = require('./utils/log');

const scoreMove = (data, grid, pos, wrap = false) => {
    let { x, y } = pos;

    // If standard, avoid out-of-bounds
    if (!wrap && (x < 0 || x >= grid.length || y < 0 || y >= grid[0].length))
        return { score: 0, scoreData: 'out-of-bounds' };

    // If wrap, adjust out-of-bounds
    if (wrap) {
        if (x < 0) x = grid.length - 1;
        if (x >= grid.length) x = 0;
        if (y < 0) y = grid[0].length - 1;
        if (y >= grid[0].length) y = 0;
    }

    // Avoid hazards and snakes
    if (grid[x][y] < cellLevels.empty) return { score: 0, scoreData: `cell marked ${cellLevels[grid[x][y]]}` };

    // Score based on space
    let open = 0;
    floodFill(grid, pos, (grid, x, y) => {
        // Track open cells we found
        if (grid[x][y] >= 0) open++;

        // Don't explore from bad cells
        if (grid[x][y] < 0) return { continue: true };
    }, wrap);
    const scoreSpace = open / (grid.length * grid[0].length);

    // Find nearest food
    const food = floodFill(grid, pos, (grid, x, y) => {
        // If we find food, return it
        if (grid[x][y] === 1) return { return: { x, y } };

        // Don't explore from bad cells
        if (grid[x][y] < 0) return { continue: true };
    }, wrap);

    // Score food based on distance and current health
    const scoreFood = food ? 1 - ((Math.abs(x - food.x) + Math.abs(y - food.y)) / (grid.length + grid[0].length)) : 0;
    const scoreFoodHealth = scoreFood * (1 - (data.you.health / 100));

    // TODO: If longer than width or height and travelling in that direction, leave gap at end of row/column

    // Score based on space + food
    return { score: scoreSpace * 0.5 + scoreFoodHealth * 0.5, scoreData: { scoreSpace, scoreFood, scoreFoodHealth } };
};

module.exports = data => {
    // Create the empty grid
    const grid = Array(data.board.width).fill(cellLevels.empty)
        .map(() => Array(data.board.height).fill(cellLevels.empty));

    // Get everything unsafe on the board
    for (const snake of data.board.snakes) for (const part of snake.body) grid[part.x][part.y] = cellLevels.snake;
    for (const hazard of data.board.hazards) grid[hazard.x][hazard.y] = cellLevels.hazard;

    // Get all the food on the board
    for (const food of data.board.food) grid[food.x][food.y] = cellLevels.food;

    // Get all possible moves
    const potential = [
        { x: data.you.head.x + 1, y: data.you.head.y, move: 'right' },
        { x: data.you.head.x - 1, y: data.you.head.y, move: 'left' },
        { x: data.you.head.x, y: data.you.head.y + 1, move: 'up' },
        { x: data.you.head.x, y: data.you.head.y - 1, move: 'down' },
    ];

    // Check if running in wrapped mode
    const wrap = data.game.ruleset.name === 'wrapped';

    // Score each move
    const moves = potential.map(move => ({ ...move, ...scoreMove(data, grid, move, wrap) }))
        .sort((a, b) => b.score - a.score);
    log(logLevels.debug, JSON.stringify(moves));

    // Go!
    log(logLevels.debug, `[${data.turn}] Head: (${data.you.head.x}, ${data.you.head.y}) | Move: ${moves[0].move} ${moves[0].score} (${moves[0].x}, ${moves[0].y})`);
    return { move: moves[0].move };
};
