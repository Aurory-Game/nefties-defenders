# Nefties Defenders Prototype

## Client

To build the game client, go to client directory `cd client`, install the dependencies via `npm install`, then `npm run build`. This will create bundled and minified `public/game.js` file, which can be loaded by a browser. Before the client can be built, [schema](#colyseus-schema) needs to be generated.

Use `npm run dev` to run an ESBuild dev server for fast iteration times.

To serve the game, all the static assets in `public` folder are needed to be served, alongside the generated `game.js`. See `public/index.html` file for an example of how the game can be initialized.

### Colyseus Schema

Client also requires schema files that are generated from Server sources. Before the client can be built, execute `npm run schema-codegen` in the `server` directory.
