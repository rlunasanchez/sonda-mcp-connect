# Notice

**Sonda MCP Connect** is a modified fork of
[figma-console-mcp](https://github.com/southleft/figma-console-mcp) by Southleft and its contributors.

## Original work

- Copyright (c) 2025 Figma Console MCP Contributors
- Released under the MIT License. The original copyright notice and license text are kept
  unchanged in [LICENSE](LICENSE), as the MIT License requires.
- Forked from release v1.46.0. The branch `upstream-mirror` holds an untouched copy of that state.

## Modifications by Sonda MCP Connect

- Copyright (c) 2026 Sonda MCP Connect (rlunasanchez), added beneath the original line in `LICENSE`.
- Renamed the package, the command and the Figma plugin (`package.json`, `figma-desktop-bridge/manifest.json`).
- Removed the author's cloud relay domains from the plugin manifest: the plugin only reaches `localhost`.
- Removed the original npm publishing workflow (`.github/workflows/publish.yml`).
- Added `rebrand.config.json` and `scripts/rebrand.mjs` to re-apply these changes after merging upstream.
- The server code, the read tools and the write tools are unchanged.

## Not included

The hosted service at `figma-console-mcp.southleft.com` and the names and branding of the original
project belong to their owners and are not part of this fork.
