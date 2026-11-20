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
claude mcp add sonda-mcp-connect -- node /Users/<you>/sonda-mcp-connect/dist/local.js

# Windows (PowerShell)
claude mcp add sonda-mcp-connect -- node C:\Users\<you>\sonda-mcp-connect\dist\local.js
```

Check it with `/mcp` inside Claude Code: `sonda-mcp-connect` must appear as connected.

Optional: some tools use the Figma REST API and need a personal access token. Create it in Figma
(Settings, Security) with the minimum scopes, and pass it only through the MCP client config:

```bash
claude mcp add sonda-mcp-connect -e FIGMA_ACCESS_TOKEN=<token> -- node <path>/dist/local.js
```

Never write the token in a file of this repository.

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
