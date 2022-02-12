# battlesnake

:wave: This is my bad attempt at implementing my own [Battlesnake](https://play.battlesnake.com/).

It is built as a [Cloudflare Worker](https://workers.cloudflare.com/), and the production version is
accessible in Battlesnake as [MattIPv6](https://play.battlesnake.com/u/mattipv4/mattipv6/).

## Development

As this is built as a Cloudflare Worker, you will be using the `wrangler` CLI to run it locally, as
well as to deploy it to production. Aliases for the key commands have been added as NPM scripts:

- To build the Battlesnake locally, with change watching, run `npm run dev`. This will start
  `wrangler` and use the Webpack config to build the Battlesnake worker, and then run it as a
  locally accessible web server.

- To make the local Battlesnake accessible for testing, you can use any tunnel service. I prefer to
  use [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/run-tunnel/trycloudflare)
  and an NPM script is available to spawn one if you have the CLI installed: `npm run tunnel`.

- Finally, to build and deploy the Battlesnake to production (accessible via workers.dev), run the
  NPM script `npm run publish`.

## License

This project is licensed under the [Apache 2.0](LICENSE) license.
