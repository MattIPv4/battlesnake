const floodFill = require('./utils/floodFill');
const log = require('./utils/log');
const { adjust, surrounding } = require('./utils/position');

/**
 * @param {number} val
 * @param {number} exp
 * @param {boolean} [reverse=false]
 * @return {number}
 */
const exponential = (val, exp = 2, reverse = false) => (reverse ? -val + 1 : val) ** exp;

/**
 * @param {import('./utils/typedefs').Grid} grid
 * @param {number} x
 * @param {number} y
 * @return {boolean}
 */
const isTail = (grid, x, y) => grid[x][y].snake
    && x === grid[x][y].snake.body[grid[x][y].snake.body.length - 1].x
    && y === grid[x][y].snake.body[grid[x][y].snake.body.length - 1].y;

/**
 * @type {import('./utils/typedefs').ScoreFunction}
 */
const scoreSpace = (data, grid, pos, wrap, constrict) => {
    // Score based on space
    // TODO: Consider where other snakes could move to when ranking the space for this cell
    // TODO: Do we have enough health to explore hazard cells
    let open = 0;
    let danger = 0;
    floodFill(grid, pos, (grid, x, y) => {
        // Don't explore from cells that contain a snake, unless it's the tail and we're not in constrict mode
        if (grid[x][y].snake && (constrict || !isTail(grid, x, y))) return { continue: true };

        // Track open cells we found (treat hazard cells and tails as open, but give them far less weight)
        // Hazard cells do us harm if our head is in one, and tails may still be there if the snake eats food
        if (grid[x][y].hazard || grid[x][y].snake) danger++;
        else open++;
    }, wrap);

    return {
        score: (open + danger/5) / (grid.length * grid[0].length),
        data: { open, danger },
    };
};

/**
 * @type {import('./utils/typedefs').ScoreFunction}
 */
const scoreFood = (data, grid, pos, wrap, constrict) => {
    // Find nearest food
    const foodPos = floodFill(grid, pos, (grid, x, y) => {
        // Don't explore from snake or hazard cells (allow exploring past hazards if we're currently in the hazard)
        // TODO: Allow always exploring past hazards, but account for the damage they do
        if (grid[x][y].snake || (grid[x][y].hazard && !grid[data.you.head.x][data.you.head.y].hazard))
            return { continue: true };

        // If we find food, return it
        if (grid[x][y].food) return { return: { x, y } };
    }, wrap);
    const manhattan = foodPos ? Math.abs(pos.x - foodPos.x) + Math.abs(pos.y - foodPos.y) : 0;

    // Score food based on distance and current health, non-linearly
    const food = exponential(manhattan / (grid.length + grid[0].length), 5, true);
    const health = exponential(data.you.health / 100, 5, true);

    return {
        score: food * health,
        data: {
            manhattan,
            food,
            health,
        },
    };
};

/**
 * @type {import('./utils/typedefs').ScoreFunction}
 */
const scoreHeadToHead = (data, grid, pos, wrap, constrict) => {
    // Check for head-to-heads
    const dangerousHeads = surrounding(pos).filter(cell => {
        const cellAdjusted = adjust(cell, grid, wrap);
        if (!cellAdjusted) return false;

        if (!grid[cellAdjusted.x][cellAdjusted.y].snake) return false;
        if (grid[cellAdjusted.x][cellAdjusted.y].snake.id === data.you.id) return false;
        if (grid[cellAdjusted.x][cellAdjusted.y].snake.head.x !== cellAdjusted.x) return false;
        if (grid[cellAdjusted.x][cellAdjusted.y].snake.head.y !== cellAdjusted.y) return false;
        if (grid[cellAdjusted.x][cellAdjusted.y].snake.length < data.you.length) return false;

        return true;
    });

    // Don't subtract 1 from `data.snakes.length` to account for self, as we never want this to equal 0
    return {
        score: 1 - (dangerousHeads.length / data.board.snakes.length),
        data: {
            potential: dangerousHeads.length,
        },
    };
};

/**
 * @type {import('./utils/typedefs').ScoreFunction}
 */
const scoreMove = (data, grid, pos, wrap, constrict) => {
    // Adjust for out-of-bounds
    const adjusted = adjust(pos, grid, wrap);
    if (!adjusted) return { score: 0, data: { msg: 'cell is out of bounds' } };
    const { x, y } = adjusted;

    // Avoid any snakes at all costs (unless it's the tail and we're not in constrict mode)
    if (grid[x][y].snake && (constrict || !isTail(grid, x, y)))
        return { score: 0, data: { msg: 'cell contains snake' } };

    // Get all the raw scores to consider
    const scores = [
        {
            name: 'space',
            type: 'add',
            weight: 6,
            ...scoreSpace(data, grid, adjusted, wrap, constrict),
        },
        {
            name: 'food',
            type: 'add',
            weight: 4,
            ...scoreFood(data, grid, adjusted, wrap, constrict),
        },
        {
            // Try to avoid potential head-to-heads we can't win, but allow them if we must
            name: 'head-to-head',
            type: 'mult',
            ...scoreHeadToHead(data, grid, adjusted, wrap, constrict),
        },
        {
            // If occupied by a tail, there is a chance the snake eats food and the tail doesn't disppear
            name: 'snake-tail',
            type: 'mult',
            score: isTail(grid, x, y) ? 0.8 : 1,
            data: isTail(grid, x, y) ? { msg: 'cell contains snake tail' } : {},
        },
        {
            // Try to avoid hazard cells if we can, but allow them to be used if we absolutely must
            // Unless we have less health than it will do damage, then always avoid
            // TODO: If we want to enter a hazard, do we have enough health to get to the next non-hazard cell?
            name: 'hazard',
            type: 'mult',
            score: grid[x][y].hazard ? (data.you.health > data.game.ruleset.settings.hazardDamagePerTurn ? 0.1 : 0) : 1,
            data: grid[x][y].hazard ? { msg: 'cell is hazardous' } : {},
        },
    ];

    const totalWeight = scores.reduce((acc, score) => score.type === 'add'
        ? acc + score.weight
        : acc, 0);
    const scoreAdd = scores.reduce((acc, score) => score.type === 'add'
        ? acc + score.score * (score.weight / totalWeight)
        : acc, 0);
    const scoreMult = scores.reduce((acc, score) => score.type === 'mult'
        ? acc * score.score
        : acc, 1);

    return {
        score: scoreAdd * scoreMult,
        data: {
            scores,
            scoreAdd,
            scoreMult,
        },
    };
};

/**
 * @param {import('./utils/typedefs').GameState} data
 * @return {{move: string}}
 */
module.exports = data => {
    /**
     * Create the empty grid
     * @type {import('./utils/typedefs').Grid}
     */
    const grid = Array(data.board.width).fill(null)
        .map(() => Array(data.board.height).fill(null)
            .map(() => ({})));

    // Check what gamemode we're running
    const wrap = data.game.ruleset.name === 'wrapped';
    const constrict = data.game.ruleset.name === 'constrictor';

    // Track all snakes on the board
    for (const snake of data.board.snakes) for (const part of snake.body) grid[part.x][part.y].snake = snake;

    // Track all hazards on the board
    for (const hazard of data.board.hazards) grid[hazard.x][hazard.y].hazard = hazard;

    // Track all the food on the board
    for (const food of data.board.food) grid[food.x][food.y].food = food;

    // Score each move from current position
    const moves = surrounding(data.you.head)
        .map(move => ({ ...move, ...scoreMove(data, grid, move, wrap, constrict) }))
        .sort((a, b) => b.score - a.score);
    log.info(JSON.stringify(moves));

    // Go!
    log.info(`[${data.turn}] Head: (${data.you.head.x}, ${data.you.head.y}) | Move: ${moves[0].move} ${moves[0].score} (${moves[0].x}, ${moves[0].y})`);
    return { move: moves[0].move };
};
