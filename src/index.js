const logLevels = {};
logLevels[logLevels.debug = 0] = 'debug';
logLevels[logLevels.warn = 1] = 'warn';
logLevels[logLevels.error = 2] = 'error';

const floodFill = (grid, pos, callback, wrap = false) => {
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
    if (grid[x][y] < 0) return { score: 0, scoreData: `cell marked ${grid[x][y]}` };

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

const log = (level, ...args) => {
    if (level < logLevels.warn && process.env.SNAKE_DEBUG !== 'true') return;

    switch (level) {
        case logLevels.debug:
            console.log(...args);
            break;
        case logLevels.warn:
            console.warn(...args);
            break;
        case logLevels.error:
            console.error(...args);
            break;
    }
};

const handleRequest = async event => {
    const url = new URL(event.request.url);
    url.pathname = url.pathname.replace(/(?<=.)\/$/, '');

    // GET / : Snake info
    if (url.pathname === '/' && event.request.method === 'GET')
        return new Response(JSON.stringify({
            apiversion: '1',
            author: 'MattIPv4',
            color: '#0069ff',
            head: 'bendr',
            tail: 'round-bum',
            version: '0.0.1-beta',
        }, null, 2), { status: 200 });

    // POST /start : Game has started
    if (url.pathname === '/start' && event.request.method === 'POST')
        return new Response(JSON.stringify({}, null, 2), { status: 200 });

    // POST /end : Game has ended
    if (url.pathname === '/end' && event.request.method === 'POST')
        return new Response(JSON.stringify({}, null, 2), { status: 200 });

    // POST /move : New game turn, decide move
    if (url.pathname === '/move' && event.request.method === 'POST') {
        const data = await event.request.json();

        // Create the empty grid
        const grid = Array(data.board.width).fill(0).map(() => Array(data.board.height).fill(0));

        // Get everything unsafe on the board
        for (const snake of data.board.snakes) for (const part of snake.body) grid[part.x][part.y] = -1;
        for (const hazard of data.board.hazards) grid[hazard.x][hazard.y] = -1;

        // Get all the food on the board
        for (const food of data.board.food) grid[food.x][food.y] = 1;

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
        return new Response(JSON.stringify({ move: moves[0].move }, null, 2), { status: 200 });
    }

    // 404 response
    return new Response(null, { status: 404 });
};

// Register the worker listener
addEventListener('fetch', event => event.respondWith(handleRequest(event)));
