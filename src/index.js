const floodFill = (grid, pos, callback = () => {}) => {
    const queue = [ pos ];
    const visited = new Set();

    while (queue.length) {
        const { x, y } = queue.shift();

        // Ignore out-of-bounds
        if (x < 0 || x >= grid.length || y < 0 || y >= grid[0].length) continue;

        // Handle visited
        if (visited.has(`${x},${y}`)) continue;
        visited.add(`${x},${y}`);

        // Run callback, return if value
        const res = callback(grid, x, y);
        if (res !== undefined) return res;

        // Add neighbors
        queue.push({ x: x - 1, y }, { x: x + 1, y }, { x, y: y - 1 }, { x, y: y + 1 });
    }
};

const scoreMove = (data, grid, pos) => {
    const { x, y } = pos;

    // Avoid out-of-bounds
    if (x < 0 || x >= grid.length) return 0;
    if (y < 0 || y >= grid[0].length) return 0;

    // Avoid hazards and snakes
    if (grid[x][y] < 0) return 0;

    // Score based on space
    let open = 0;
    floodFill(grid, pos, (grid, x, y) => {
        if (grid[x][y] >= 0) open++;
    });
    const scoreSpace = open / (grid.length * grid[0].length);

    // Find nearest food
    const food = floodFill(grid, pos, (grid, x, y) => {
        if (grid[x][y] === 1) return { x, y };
    });
    const scoreFood = food ? 1 - ((Math.abs(x - food.x) + Math.abs(y - food.y)) / (grid.length + grid[0].length)) : 0;

    // TODO: Reduce initial food bias, increase as health decreases
    // TODO: In current state this tends to get itself trapped in an enclosed area

    // Score based on space + food
    return scoreFood * 0.5 + scoreSpace * 0.5;
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
            head: 'default',
            tail: 'default',
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

        // Score each move
        const moves = potential.map(m => ({ ...m, score: scoreMove(data, grid, m) })).sort((a, b) => b.score - a.score);

        // Go!
        console.log(`[${data.turn}] Head: (${data.you.head.x}, ${data.you.head.y}) | Move: ${moves[0].move} ${moves[0].score} (${moves[0].x}, ${moves[0].y})`);
        return new Response(JSON.stringify({ move: moves[0].move }, null, 2), { status: 200 });
    }

    // 404 response
    return new Response(null, { status: 404 });
};

// Register the worker listener
addEventListener('fetch', event => event.respondWith(handleRequest(event)));
