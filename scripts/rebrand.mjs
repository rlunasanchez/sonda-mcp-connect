// Idempotent rebrand: re-run after every merge from upstream (git merge upstream/main).
// Edits names and texts only; it never touches tools, server code or plugin logic.
import { readFileSync, writeFileSync, rmSync } from "node:fs";
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

// Manifest is edited as text (not re-serialized) so its formatting stays identical to
// upstream and merges do not conflict on whitespace.
const manifestPath = path("figma-desktop-bridge/manifest.json");
const manifestText = readFileSync(manifestPath, "utf8")
	.replace(/("name":\s*)"[^"]*"/, `$1"${cfg.pluginName}"`)
	.replace(/("id":\s*)"[^"]*"/, `$1"${cfg.pluginId}"`)
	.replace(/\r?\n[^\n]*southleft\.com[^\n]*/g, "") // drop the author's cloud relay domains
	.replace(/,(\s*\])/g, "$1") // no trailing comma left before a closing bracket
	.replace(/(\s*"reasoning":\s*)"[^"]*"/, `$1"${cfg.manifestReasoning}"`);
JSON.parse(manifestText); // fail loudly if the manifest is no longer valid JSON
writeFileSync(manifestPath, manifestText);

// The original project's npm publish workflow must not run from this fork.
rmSync(path(".github/workflows/publish.yml"), { force: true });

// Keep the original MIT notice and add the fork's own line beneath it.
const licensePath = path("LICENSE");
const license = readFileSync(licensePath, "utf8");
if (!license.includes(cfg.licenseLine)) {
	const original = /^(Copyright \(c\) 2025 Figma Console MCP Contributors)(\r?\n)/m;
	writeFileSync(licensePath, license.replace(original, `$1$2${cfg.licenseLine}$2`));
}

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
