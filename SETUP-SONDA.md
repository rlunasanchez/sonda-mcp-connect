# Sonda MCP Connect: setup (Windows and macOS)

Requirements: Node.js 18 or newer, Git, Figma Desktop, Claude Code.

## 1. Download and build

```bash
git clone https://github.com/rlunasanchez/sonda-mcp-connect.git
cd sonda-mcp-connect
git remote add upstream https://github.com/southleft/figma-console-mcp.git
npm ci
npm run build:local
```

`npm ci` installs exactly the versions in `package-lock.json`. Run `npm audit` afterwards and review the result.

## 2. Register the server in Claude Code

Use the absolute path to `dist/local.js`.

```bash
# macOS
claude mcp add --scope user sonda-mcp-connect -- node --env-file=/Users/<you>/sonda-mcp-connect/.env /Users/<you>/sonda-mcp-connect/dist/local.js

# Windows (PowerShell)
claude mcp add --scope user sonda-mcp-connect -- node --env-file=C:\Users\<you>\sonda-mcp-connect\.env C:\Users\<you>\sonda-mcp-connect\dist\local.js
```

`--scope user` makes the server available in every folder (without it, it only exists in the folder where you ran
the command, and the skill would not see it when you work in another project folder).

`--env-file` (Node 20.6 or newer) makes Node read the token from `.env`, so the token never goes into the
Claude Code configuration. The flag must come before the path to `dist/local.js`. Create the `.env` first (next step).

Check it with `/mcp` inside Claude Code: `sonda-mcp-connect` must appear as connected.

### The Figma token lives only in `.env`

The plugin connects with a Figma personal access token. Create it in Figma (Settings, Security) with the
minimum scopes, then:

```bash
cp .env.example .env          # Windows: copy .env.example .env
# edit .env and set FIGMA_ACCESS_TOKEN=<your token>
chmod 600 .env                # macOS only; on Windows keep the file inside your user folder
```

- **The token never goes to the cloud.** `.env` is git-ignored: never commit it, never paste it in a chat
  (Claude included), and keep this folder outside OneDrive, iCloud, Dropbox and Google Drive synced folders.
- Turn on the commit guard once per clone: `git config core.hooksPath .githooks`. It blocks any staged `.env`
  file and any text that looks like a Figma token.
- Do not use `claude mcp add -e FIGMA_ACCESS_TOKEN=...`: that would store the token in the Claude Code configuration too.
- Check before every push: `git status` must not list `.env`.
- If the token is ever exposed, revoke it in Figma and create a new one.

## 3. Import the plugin in Figma

Figma Desktop: Plugins, Development, Import plugin from manifest, then pick
`figma-desktop-bridge/manifest.json`. Open your file and run "Sonda MCP Connect Bridge".
It must show as connected.

## 4. Safety rules

- Keep the server on `localhost`. Do not set `FIGMA_WS_HOST=0.0.0.0`.
- The write tools can change or delete things in your Figma file. Save a named version in the
  Figma version history before a creation session.
- This fork has no cloud mode: the plugin manifest only allows `localhost`.

## 5. Pull updates from the original project

```bash
git fetch upstream
git log main..upstream/main --oneline        # see what changed
git checkout -b update/upstream-$(date +%F)  # on Windows use any branch name
git merge upstream/main
node scripts/rebrand.mjs                     # re-applies the Sonda changes
git diff HEAD~1 -- package.json package-lock.json   # review dependency changes before building
npm ci && npm run build:local && npm test
```

Review new dependencies, install scripts and network calls before merging into `main`.
The branch `upstream-mirror` is an untouched copy of the original at v1.46.0.

## 6. Status and pending (notes for the next session)

- Built and pushed, **not yet compiled or tested in Figma**: run step 1 to 3 and check that the bridge plugin shows as connected.
- The Figma token lives only in the local `.env` (loaded with `node --env-file`). Never in the cloud, a chat or a synced folder.
- This repository is a **public fork** (GitHub does not allow private forks). Pending: duplicate it into a private repository, keep the `upstream` remote and delete the public fork.
- Optional hardening: require a shared token on the local WebSocket (today it accepts connections without an origin or with origin `null`). Keep it as an isolated patch, it touches `src/core/websocket-server.ts` and `figma-desktop-bridge/ui.html`.
- This plugin is separate from the `sonda-figma-to-fullstack` skill (private repo `rlunasanchez/sonda-skill`, see its `docs/NOTAS-COMPLETAS.md`). They only share the MCP connection.
