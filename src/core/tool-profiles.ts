/**
 * SONDA: tool profiles.
 *
 * Every tool definition is sent to the model in each conversation, so publishing all of them costs
 * tokens (about 54k for the full set). SONDA_TOOLS selects which tools this server publishes.
 *
 *   SONDA_TOOLS unset or "todo"   -> every tool (original behaviour)
 *   SONDA_TOOLS=esencial          -> read the open file, run code in it, screenshots (13 tools)
 *   SONDA_TOOLS=diseno            -> esencial + the common create/edit tools
 *   SONDA_TOOLS=esencial,figma_get_comments  -> a profile plus individual tool names
 *
 * The value is a comma separated list; each item is a profile name or a tool name.
 * Isolated patch: hooked from createMcpServer() in local.ts with one call.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const ESENCIAL = [
	"figma_get_status",
	"figma_list_open_files",
	"figma_navigate",
	"figma_execute",
	"figma_take_screenshot",
	"figma_get_selection",
	"figma_get_variables",
	"figma_get_styles",
	"figma_get_text_styles",
	"figma_get_component_for_development",
	"figma_search_components",
	"figma_get_file_data",
	"figma_get_design_system_summary",
];

const DISENO = [
	...ESENCIAL,
	"figma_set_fills",
	"figma_set_strokes",
	"figma_set_text",
	"figma_set_layout",
	"figma_set_image_fill",
	"figma_set_description",
	"figma_create_child",
	"figma_clone_node",
	"figma_move_node",
	"figma_resize_node",
	"figma_rename_node",
	"figma_delete_node",
	"figma_instantiate_component",
	"figma_set_instance_properties",
	"figma_create_variable",
	"figma_update_variable",
	"figma_create_variable_collection",
	"figma_batch_create_variables",
	"figma_batch_update_variables",
];

const PROFILES: Record<string, string[]> = { esencial: ESENCIAL, diseno: DISENO };

/** Returns the allowed tool names, or null when every tool is allowed. */
export function resolveAllowedTools(spec: string | undefined): Set<string> | null {
	const items = (spec ?? "")
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
	if (items.length === 0 || items.includes("todo")) return null;

	const allowed = new Set<string>();
	for (const item of items) {
		for (const name of PROFILES[item] ?? [item]) allowed.add(name);
	}
	return allowed;
}

type Registrar = (...args: unknown[]) => unknown;

/** Stand-in returned for a tool that is not published, so callers that keep the handle do not break. */
const SKIPPED_TOOL = { enable() {}, disable() {}, update() {}, remove() {} };

/**
 * Makes `server` skip every tool that is not in the selected profile.
 * Call it once, after the other wrappers, so it is the outermost one.
 */
export function applyToolProfile(server: McpServer, spec: string | undefined = process.env.SONDA_TOOLS): void {
	const allowed = resolveAllowedTools(spec);
	if (!allowed) return;

	const target = server as unknown as Record<string, Registrar | undefined>;
	const published = new Set<string>();

	for (const method of ["tool", "registerTool"]) {
		const original = target[method]?.bind(target);
		if (!original) continue;
		target[method] = (...args: unknown[]) => {
			const name = args[0];
			if (typeof name !== "string" || !allowed.has(name)) return SKIPPED_TOOL;
			published.add(name);
			return original(...args);
		};
	}

	// Typos in SONDA_TOOLS would silently hide a tool: report them once registration is done.
	setTimeout(() => {
		const unknown = [...allowed].filter((name) => !published.has(name));
		if (unknown.length > 0) {
			console.error(`[sonda] SONDA_TOOLS: no such tool(s), ignored: ${unknown.join(", ")}`);
		}
	}, 3000).unref();
}
