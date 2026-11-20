// Idempotent rebrand: re-run after every merge from upstream (git merge upstream/main).
// Edits names and texts only; it never touches tools, server code or plugin logic.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cfg = JSON.parse(readFileSync(join(root, "rebrand.config.json"), "utf8"));
const path = (file) => join(root, file);

function editJson(file, mutate) {
	const raw = readFileSync(path(file), "utf8");
	const indent = /^\t/m.test(raw) ? "\t" : 2;
	const data = JSON.parse(raw);
	mutate(data);
	writeFileSync(path(file), JSON.stringify(data, null, indent) + "\n");
}

function renameBin(bin, target) {
	if (!bin) return bin;
	const [firstTarget] = Object.values(bin);
	return { [cfg.packageName]: target ?? firstTarget };
}

editJson("package.json", (pkg) => {
	pkg.name = cfg.packageName;
	pkg.bin = renameBin(pkg.bin);
	pkg.repository = { type: "git", url: cfg.repositoryUrl };
	if (!pkg.description.startsWith(cfg.descriptionPrefix)) {
		pkg.description = cfg.descriptionPrefix + pkg.description;
	}
});

editJson("package-lock.json", (lock) => {
	lock.name = cfg.packageName;
	const rootPkg = lock.packages?.[""];
	if (rootPkg) {
		rootPkg.name = cfg.packageName;
		rootPkg.bin = renameBin(rootPkg.bin);
	}
});

editJson("figma-desktop-bridge/manifest.json", (manifest) => {
	manifest.name = cfg.pluginName;
	manifest.id = cfg.pluginId;
});

const readmePath = path("README.md");
const readme = readFileSync(readmePath, "utf8");
if (!readme.includes(cfg.readmeMarker)) {
	const rebranded = readme.replace(
		/^# Figma Console MCP Server\r?\n/,
		`${cfg.readmeTitle}\n\n${cfg.readmeMarker}\n${cfg.readmeNotice}\n`,
	);
	writeFileSync(readmePath, rebranded);
}

console.log(`Rebrand applied: ${cfg.packageName}`);
