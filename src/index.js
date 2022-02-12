const move = require('./move');

const handleRequest = async event => {
    const url = new URL(event.request.url);
    url.pathname = url.pathname.replace(/(?<=.)\/$/, '');

    // GET / : Snake info
    if (url.pathname === '/' && event.request.method === 'GET')
        return new Response(JSON.stringify({
            apiversion: '1',
            author: 'MattIPv4',
            color: process.env.SNAKE_DEBUG === 'true' ? '#00c6ff' : '#0069ff',
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
    if (url.pathname === '/move' && event.request.method === 'POST')
        return new Response(JSON.stringify(move(await event.request.json()), null, 2), { status: 200 });

    // 404 response
    return new Response(null, { status: 404 });
};

// Register the worker listener
addEventListener('fetch', event => event.respondWith(handleRequest(event)));
