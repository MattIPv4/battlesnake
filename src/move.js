const { cellLevels, logLevels } = require('./utils/enums');
const floodFill = require('./utils/floodFill');
const log = require('./utils/log');
const { adjust, surrounding } = require('./utils/position');

const exponential = (val, exp = 2, reverse = false) => (reverse ? -val + 1 : val) ** exp;

const scoreSpace = (data, grid, pos, wrap) => {
    // Score based on space
    // TODO: Consider where other snakes could move to when ranking the space for this cell
    let open = 0;
    floodFill(grid, pos, (grid, x, y) => {
        // Track open cells we found
        if (grid[x][y].level >= cellLevels.empty) open++;

        // Don't explore from bad cells
        if (grid[x][y].level < cellLevels.empty) return { continue: true };
    }, wrap);

    return { score: open / (grid.length * grid[0].length), data: {} };
};

const scoreFood = (data, grid, pos, wrap) => {
    // Find nearest food
    const foodPos = floodFill(grid, pos, (grid, x, y) => {
        // If we find food, return it
        if (grid[x][y].level === cellLevels.food) return { return: { x, y } };

        // Don't explore from bad cells
        if (grid[x][y].level < cellLevels.empty) return { continue: true };
    }, wrap);
    const manhattan = foodPos ? Math.abs(pos.x - foodPos.x) + Math.abs(pos.y - foodPos.y) : 0;

    // Score food based on distance and current health, non-linearly
    const food = exponential(manhattan / (grid.length + grid[0].length), 5, true);
    const health = exponential(data.you.health / 100, 5, true);

    return { score: food * health, data: { manhattan, food, health } };
};

const scoreHeadToHead = (data, grid, pos, wrap) => {
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

    // Don't subtract 1 from `data.snakes.length` to account for self, as we never want this to equal 0
    return { score: 1 - (dangerousHeads.length / data.board.snakes.length), data: {} };
};

const scoreMove = (data, grid, pos, wrap) => {
    // Adjust for out-of-bounds
    const adjusted = adjust(pos, grid, wrap);
    if (!adjusted) return { score: 0, scoreData: 'out-of-bounds' };
    const { x, y } = adjusted;

    // Avoid hazards and snakes
    if (grid[x][y].level < cellLevels.empty)
        return { score: 0, scoreData: `cell marked ${cellLevels[grid[x][y].level]}` };

    // Get all the raw scores to consider
    const scores = [
        {
            name: 'space',
            type: 'add',
            weight: 6,
            ...scoreSpace(data, grid, adjusted, wrap),
        },
        {
            name: 'food',
            type: 'add',
            weight: 4,
            ...scoreFood(data, grid, adjusted, wrap),
        },
        {
            name: 'head-to-head',
            type: 'mult',
            ...scoreHeadToHead(data, grid, adjusted, wrap),
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

module.exports = data => {
    // Create the empty grid
    const grid = Array(data.board.width).fill(null)
        .map(() => Array(data.board.height).fill(null)
            .map(() => ({ level: cellLevels.empty })));

    // Check what gamemode we're running
    const wrap = data.game.ruleset.name === 'wrapped';
    const constrict = data.game.ruleset.name === 'constrictor';

    // Track all snakes on the board
    for (const snake of data.board.snakes) {
        const snakeLength = snake.body.length;
        for (const [ index, part ] of snake.body.entries()) {
            // If not constricting, ignore the tail as it will be gone during this tick
            if (!constrict && index === snakeLength - 1) continue;

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

    // Score each move from current position
    const moves = surrounding(data.you.head).map(move => ({ ...move, ...scoreMove(data, grid, move, wrap) }))
        .sort((a, b) => b.score - a.score);
    log(logLevels.debug, JSON.stringify(moves));

    // Go!
    log(logLevels.debug, `[${data.turn}] Head: (${data.you.head.x}, ${data.you.head.y}) | Move: ${moves[0].move} ${moves[0].score} (${moves[0].x}, ${moves[0].y})`);
    return { move: moves[0].move };
};
