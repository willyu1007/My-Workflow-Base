import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ignoredDirectories = new Set([
  ".git",
  ".next",
  "coverage",
  "dist",
  "generated",
  "node_modules",
  "vendor",
]);
const sourceExtensions = new Set([
  ".cjs",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".mts",
  ".ts",
  ".tsx",
]);
const dependencySections = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
  "pnpm.overrides",
];

function walkFiles(root) {
  const files = [];

  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
        continue;
      }
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(path);
      } else if (entry.isFile()) {
        files.push(path);
      }
    }
  }

  visit(root);
  return files;
}

function dependencyEntries(packageJson) {
  return dependencySections.flatMap((section) => {
    const record = section === "pnpm.overrides"
      ? packageJson.pnpm?.overrides
      : packageJson[section];
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      return [];
    }
    return Object.entries(record).map(([name, spec]) => ({
      section,
      name,
      spec: String(spec),
    }));
  });
}

function isLocalSpec(spec) {
  return /^(?:file|link):/.test(spec);
}

function isSharedWorkflowPackage(name) {
  return /(?:^|\/)workflow-(?:contracts|runtime)$/.test(name);
}

function isBaseArtifact(name, spec) {
  return (
    name === "@willyu1007/web-workbench" ||
    /my-workflow-base/i.test(name) ||
    /My-Workflow-Base/i.test(spec)
  );
}

function isMyChatContract(name, spec) {
  return (
    /^@my-chat\/workflow-(?:contracts|runtime)$/.test(name) ||
    /My-Chat\/packages\/workflow-(?:contracts|runtime)/i.test(spec)
  );
}

function hasVerifiedMyChatPin(repositoryRoot) {
  const pinPath = join(
    repositoryRoot,
    "docs/project/integrations/my-chat-workflow-contract.json",
  );
  const verifierPath = join(repositoryRoot, "scripts/verify-workflow-contract-pin.mjs");
  const ciPath = join(repositoryRoot, ".github/workflows/ci.yml");

  if (!existsSync(pinPath) || !existsSync(verifierPath) || !existsSync(ciPath)) {
    return false;
  }

  let pin;
  try {
    pin = JSON.parse(readFileSync(pinPath, "utf8"));
  } catch {
    return false;
  }

  const revision = pin?.myChat?.revision;
  const hasRevision = typeof revision === "string" && /^[0-9a-f]{40}$/i.test(revision);
  const verifier = readFileSync(verifierPath, "utf8");
  const ci = readFileSync(ciPath, "utf8");
  return (
    hasRevision &&
    verifier.includes("my-chat-workflow-contract.json") &&
    ci.includes("verify-workflow-contract-pin")
  );
}

export function inspectConsumerBoundaries({
  repository,
  consumerRole = "base",
}) {
  const repositoryRoot = resolve(repository);
  if (!existsSync(repositoryRoot) || !statSync(repositoryRoot).isDirectory()) {
    throw new Error(`consumer repository does not exist: ${repositoryRoot}`);
  }
  if (!["base", "host", "scenario"].includes(consumerRole)) {
    throw new Error(`unsupported consumer role: ${consumerRole}`);
  }

  const findings = [];
  const files = walkFiles(repositoryRoot);
  const packageJsonFiles = files.filter((path) => path.endsWith("package.json"));
  const hasMyChatPin = hasVerifiedMyChatPin(repositoryRoot);

  for (const path of packageJsonFiles) {
    let packageJson;
    try {
      packageJson = JSON.parse(readFileSync(path, "utf8"));
    } catch {
      continue;
    }

    if (
      consumerRole === "scenario" &&
      typeof packageJson.name === "string" &&
      isSharedWorkflowPackage(packageJson.name)
    ) {
      findings.push({
        rule_id: "ECO-CONSUMER-001",
        path: relative(repositoryRoot, path),
        message: `scenario repository owns an unsupported shared package fork: ${packageJson.name}`,
      });
    }

    for (const dependency of dependencyEntries(packageJson)) {
      if (!isLocalSpec(dependency.spec)) {
        continue;
      }

      if (isBaseArtifact(dependency.name, dependency.spec)) {
        findings.push({
          rule_id: "ECO-CONSUMER-002",
          path: relative(repositoryRoot, path),
          message: `Base artifact uses a local source dependency: ${dependency.name}@${dependency.spec}`,
        });
      } else if (isMyChatContract(dependency.name, dependency.spec) && !hasMyChatPin) {
        findings.push({
          rule_id: "ECO-CONSUMER-003",
          path: relative(repositoryRoot, path),
          message: `My-Chat local contract dependency lacks an exact pin and CI verifier: ${dependency.name}`,
        });
      }
    }
  }

  if (consumerRole !== "base") {
    for (const path of files) {
      const extension = path.slice(path.lastIndexOf("."));
      if (!sourceExtensions.has(extension)) {
        continue;
      }
      const source = readFileSync(path, "utf8");
      const directSiblingSource =
        /(?:from\s*|import\s*\()\s*["'][^"']*(?:My-Chat|My-Workflow-Base)\/(?:apps|packages|templates|src)\//.test(
          source,
        );
      if (directSiblingSource) {
        findings.push({
          rule_id: "ECO-CONSUMER-004",
          path: relative(repositoryRoot, path),
          message: "source imports directly from a sibling repository tree",
        });
      }
    }
  }

  return findings;
}

function parseArguments(argv) {
  const options = {
    repository: process.cwd(),
    consumerRole: "base",
    strict: false,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--repo") {
      options.repository = argv[index + 1];
      index += 1;
    } else if (argument === "--consumer-role") {
      options.consumerRole = argv[index + 1];
      index += 1;
    } else if (argument === "--strict") {
      options.strict = true;
    } else if (argument === "--json") {
      options.json = true;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }

  return options;
}

const isCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const options = parseArguments(process.argv.slice(2));
  const findings = inspectConsumerBoundaries(options);
  if (options.json) {
    console.log(JSON.stringify({ version: 1, findings }, null, 2));
  } else if (findings.length === 0) {
    console.log("consumer boundary conformance ok");
  } else {
    for (const finding of findings) {
      console.warn(`${finding.rule_id} ${finding.path}: ${finding.message}`);
    }
    console.warn(`consumer boundary conformance found ${findings.length} advisory issue(s)`);
  }

  if (options.strict && findings.length > 0) {
    process.exitCode = 1;
  }
}
