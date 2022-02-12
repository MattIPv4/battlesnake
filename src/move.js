const { cellLevels, logLevels } = require('./utils/enums');
const floodFill = require('./utils/floodFill');
const log = require('./utils/log');
const { adjust, surrounding } = require('./utils/position');

const nonLinear = (val, exp = 2, inverse = false) => (inverse ? -val + 1 : val) ** exp;

const scoreMove = (data, grid, pos, wrap = false) => {
    // Adjust for out-of-bounds
    const adjusted = adjust(pos, grid, wrap);
    if (!adjusted) return { score: 0, scoreData: 'out-of-bounds' };
    const { x, y } = adjusted;

    // Avoid hazards and snakes
    if (grid[x][y].level < cellLevels.empty)
        return { score: 0, scoreData: `cell marked ${cellLevels[grid[x][y].level]}` };

    // Score based on space
    // TODO: Consider where other snakes could move to when ranking the space for this cell
    let open = 0;
    floodFill(grid, pos, (grid, x, y) => {
        // Track open cells we found
        if (grid[x][y].level >= cellLevels.empty) open++;

        // Don't explore from bad cells
        if (grid[x][y].level < cellLevels.empty) return { continue: true };
    }, wrap);
    const scoreSpace = open / (grid.length * grid[0].length);

    // Find nearest food
    const food = floodFill(grid, pos, (grid, x, y) => {
        // If we find food, return it
        if (grid[x][y].level === cellLevels.food) return { return: { x, y } };

        // Don't explore from bad cells
        if (grid[x][y].level < cellLevels.empty) return { continue: true };
    }, wrap);
    const scoreFoodManhattan = food ? Math.abs(x - food.x) + Math.abs(y - food.y) : 0;

    // Score food based on distance and current health, non-linearly
    const scoreFood = nonLinear(scoreFoodManhattan / (grid.length + grid[0].length), 4, true);
    const scoreHealth = nonLinear(data.you.health / 100, 4, true);
    const scoreFoodHealth = scoreFood * scoreHealth;

    // Check for head-to-heads
    const dangerousHeads = surrounding(pos).filter(cell => {
        const cellAdjusted = adjust(cell, grid, wrap);
        if (!cellAdjusted) return false;

        if (grid[cellAdjusted.x][cellAdjusted.y].level !== cellLevels.snake) return false;
        if (grid[cellAdjusted.x][cellAdjusted.y].snake.id === data.you.id) return false;
        if (grid[cellAdjusted.x][cellAdjusted.y].snake.head.x !== cellAdjusted.x) return false;
        if (grid[cellAdjusted.x][cellAdjusted.y].snake.head.y !== cellAdjusted.y) return false;
        if (grid[cellAdjusted.x][cellAdjusted.y].snake.length < data.you.length) return false;

        return true;
    });
    const scoreHeadsMult = 1 - (dangerousHeads.length / 3);

    // Score based on (space + food) * head-to-heads
    return {
        score: (scoreSpace * 0.5 + scoreFoodHealth * 0.5) * scoreHeadsMult,
        scoreData: {
            scoreSpace,
            scoreFoodManhattan,
            scoreFood,
            scoreHealth,
            scoreFoodHealth,
            scoreHeadsMult,
        },
    };
};

module.exports = data => {
    // Create the empty grid
    const grid = Array(data.board.width).fill(null)
        .map(() => Array(data.board.height).fill(null)
            .map(() => ({ level: cellLevels.empty })));

    // Track all snakes on the board
    for (const snake of data.board.snakes) {
        for (const part of snake.body) {
            grid[part.x][part.y].level = cellLevels.snake;
            grid[part.x][part.y].snake = snake;
        }
    }

    // Track all hazards on the board
    for (const hazard of data.board.hazards) {
        grid[hazard.x][hazard.y].level = cellLevels.hazard;
        grid[hazard.x][hazard.y].hazard = hazard;
    }

    // Track all the food on the board
    for (const food of data.board.food) {
        grid[food.x][food.y].level = cellLevels.food;
        grid[food.x][food.y].food = food;
    }

    // Check if running in wrapped mode
    const wrap = data.game.ruleset.name === 'wrapped';

    // Score each move from current position
    const moves = surrounding(data.you.head).map(move => ({ ...move, ...scoreMove(data, grid, move, wrap) }))
        .sort((a, b) => b.score - a.score);
    log(logLevels.debug, JSON.stringify(moves));

    // Go!
    log(logLevels.debug, `[${data.turn}] Head: (${data.you.head.x}, ${data.you.head.y}) | Move: ${moves[0].move} ${moves[0].score} (${moves[0].x}, ${moves[0].y})`);
    return { move: moves[0].move };
};
