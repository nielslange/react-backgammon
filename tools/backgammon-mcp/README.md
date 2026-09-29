# backgammon-mcp

An MCP server (and CLI) that plays **Red** against a human playing **Blue**
in the react-backgammon dev app, through a shared, visible Chrome window.

The bot clicks the same UI a human uses, so every move goes through the
app's own rules. Only "load a mid-game position" uses the dev store hook.

## Setup

```sh
pnpm dev                       # in the repo root, serves http://localhost:5173
cd tools/backgammon-mcp && pnpm install --ignore-workspace
```

Chrome (with remote debugging on port 9222) is launched on demand.

## CLI

```sh
pnpm start                     # new game, plays Red if Red starts
pnpm watch                     # keep watching and play Red whenever it's Red's turn
tsx cli.mts --midgame --watch --gentle
```

## MCP

Registered in the repo's `.mcp.json` as `backgammon`. Tools: `new_game`
(`midgame`, `strength`), `board`, `play_red`, `wait_for_my_turn`.
