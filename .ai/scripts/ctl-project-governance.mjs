#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const [command, ...args] = process.argv.slice(2);
const projectIndex = args.indexOf("--project");
const project = projectIndex >= 0 ? args[projectIndex + 1] : "main";
if (!project || (command !== "sync" && command !== "lint")) {
  throw new Error("usage: ctl-project-governance.mjs <sync|lint> [--apply|--check] --project <slug>");
}

const registryPath = resolve(root, ".ai/project", project, "registry.yaml");
const registrySource = await readFile(registryPath, "utf8");
const registry = parseRegistry(registrySource);
await validateRegistry(registry);
const outputs = renderOutputs(registry);

if (command === "sync") {
  if (!args.includes("--apply")) throw new Error("sync requires --apply");
  for (const [path, content] of outputs) {
    await mkdir(resolve(path, ".."), { recursive: true });
    await writeFile(path, content, "utf8");
  }
  process.stdout.write("[ok] Sync complete.\n");
} else {
  if (!args.includes("--check")) throw new Error("lint requires --check");
  for (const [path, expected] of outputs) {
    const actual = await readFile(path, "utf8");
    if (actual !== expected) throw new Error(`generated project view is stale: ${path}`);
  }
  process.stdout.write("[ok] Lint passed.\n");
}

function parseRegistry(source) {
  const result = { project: {}, milestones: [], features: [], requirements: [], tasks: [] };
  let section;
  let current;
  for (const rawLine of source.split(/\r?\n/u)) {
    const line = rawLine.replace(/\s+#.*$/u, "");
    const sectionMatch = line.match(/^([a-z_]+):\s*$/u);
    if (sectionMatch) {
      section = sectionMatch[1];
      current = undefined;
      continue;
    }
    if (!section || !(section in result)) continue;
    const listStart = line.match(/^\s{2}-\s+([a-z_]+):\s*(.+)$/u);
    if (listStart && Array.isArray(result[section])) {
      current = { [listStart[1]]: scalar(listStart[2]) };
      result[section].push(current);
      continue;
    }
    const property = line.match(/^\s{2,4}([a-z_]+):\s*(.+)$/u);
    if (!property) continue;
    const target = current ?? result[section];
    target[property[1]] = scalar(property[2]);
  }
  return result;
}

function scalar(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) return trimmed.slice(1, -1);
  return trimmed;
}

async function validateRegistry(registry) {
  const groups = [registry.milestones, registry.features, registry.requirements, registry.tasks];
  const ids = new Set();
  for (const group of groups) {
    for (const item of group) {
      if (!item.id || ids.has(item.id)) throw new Error(`missing or duplicate project id: ${String(item.id)}`);
      ids.add(item.id);
      if (!new Set(["planned", "in-progress", "blocked", "done"]).has(item.status)) throw new Error(`invalid status for ${item.id}: ${item.status}`);
    }
  }
  for (const feature of registry.features) if (!registry.milestones.some((item) => item.id === feature.milestone_id)) throw new Error(`${feature.id} has unknown milestone`);
  for (const requirement of registry.requirements) if (!registry.features.some((item) => item.id === requirement.feature_id)) throw new Error(`${requirement.id} has unknown feature`);
  for (const task of registry.tasks) {
    if (!registry.requirements.some((item) => item.id === task.requirement_id)) throw new Error(`${task.id} has unknown requirement`);
    await access(resolve(root, task.dev_docs_path, ".ai-task.yaml"));
  }
}

function renderOutputs(registry) {
  const taskRows = registry.tasks.map((task) => `| ${task.id} | ${task.slug} | ${task.status} | ${task.requirement_id} | ${task.updated} |`).join("\n");
  const featureRows = registry.features.map((feature) => `| ${feature.id} | ${feature.title} | ${feature.status} | ${feature.milestone_id} |`).join("\n");
  const dashboard = `# Project dashboard\n\nProject: ${registry.project.name}\n\n| Task | Slug | Status | Requirement | Updated |\n|---|---|---|---|---|\n${taskRows}\n`;
  const featureMap = `# Feature map\n\n| Feature | Title | Status | Milestone |\n|---|---|---|---|\n${featureRows}\n`;
  const taskIndex = `# Task index\n\n| Task | Slug | Status | Requirement | Updated |\n|---|---|---|---|---|\n${taskRows}\n`;
  const snapshot = `${JSON.stringify({ version: 1, generated_from: `.ai/project/${project}/registry.yaml`, ...registry }, null, 2)}\n`;
  return new Map([
    [resolve(root, ".ai/project", project, "dashboard.md"), dashboard],
    [resolve(root, ".ai/project", project, "feature-map.md"), featureMap],
    [resolve(root, ".ai/project", project, "task-index.md"), taskIndex],
    [resolve(root, "docs/context/project.registry.json"), snapshot],
  ]);
}
