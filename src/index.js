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

        // Filter out unsafe moves
        const moves = potential.filter(move => move.x >= 0 && move.x < data.board.width
            && move.y >= 0 && move.y < data.board.height
            && grid[move.x][move.y] >= 0);

        // Pick random
        const move = moves.length === 0
            ? { ...potential[0], shout: 'Welp. Oops.' }
            : moves[Math.floor(Math.random() * moves.length)];
        console.log(`[${data.turn}] Head: (${data.you.head.x}, ${data.you.head.y}) | Move: ${move.move} (${move.x}, ${move.y})`);

        // Go!
        return new Response(JSON.stringify({
            move: move.move,
            shout: move.shout,
        }, null, 2), { status: 200 });
    }

    // 404 response
    return new Response(null, { status: 404 });
};

// Register the worker listener
addEventListener('fetch', event => event.respondWith(handleRequest(event)));
