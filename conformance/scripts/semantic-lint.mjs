#!/usr/bin/env node

import { existsSync, realpathSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const runtimeKinds = new Set([
  "scenario_action",
  "model_call",
  "tool_call",
  "transform",
  "human_gate",
  "wait_for_input",
  "artifact_write",
  "event_emit",
]);
const handoffTypes = new Set([
  "public_draft",
  "indexing",
  "notification",
  "external_delivery",
]);
const forbiddenProviders = new Set(["openai", "anthropic", "claude", "gemini", "google"]);
const admittedUserClasses = new Set(["teacher", "curriculum_researcher", "subject_expert", "expert", "researcher", "admin"]);
const launchPhases = new Set(["dev", "pilot", "ga", "disabled"]);
const scenarioLifecycleStatuses = new Set(["draft", "active", "disabled", "archived"]);
const capabilityEnablementPolicies = new Set(["requires_workspace_activation", "disabled"]);
const descriptorRoles = new Set(["contract_owner", "platform_host", "scenario_owner"]);
const descriptorKeys = new Set([
  "repository",
  "role",
  "platform_ref_namespace",
  "manifest_module",
  "manifest",
  "providers",
  "scenario_aliases",
  "canonical_objects",
]);
const requiredContractObjects = new Set([
  "contract.canonical_ref",
  "contract.generation_ticket",
  "contract.integration_lock",
  "contract.scenario_command_envelope",
  "contract.scenario_command_receipt",
  "contract.scenario_contract_release",
  "contract.scenario_event_envelope",
  "contract.scenario_manifest",
  "contract.scenario_workspace_activation",
  "contract.runtime_kind_registry",
  "contract.handoff_kind_registry",
]);

function finding(ruleId, repository, path, message) {
  return { rule_id: ruleId, repository, path, message };
}

export function lintFederationDescriptors(descriptors) {
  const findings = [];
  const scenarioOwners = new Map();
  const canonicalOwners = new Map();
  const eventProducers = new Map();
  const scenarioKeys = new Set(
    descriptors
      .filter((descriptor) => descriptor.role === "scenario_owner")
      .map((descriptor) => descriptor.manifest?.scenario_key)
      .filter((scenarioKey) => typeof scenarioKey === "string"),
  );
  let platformRefNamespace;

  for (const descriptor of descriptors) {
    const repository = descriptor.repository ?? "unknown";
    const manifest = descriptor.manifest ?? {};
    const scenarioKey = manifest.scenario_key;
    const descriptorNamespace = descriptor.platform_ref_namespace;
    const role = descriptor.role;

    const unknownDescriptorKeys = Object.keys(descriptor).filter((key) => !descriptorKeys.has(key));
    if (unknownDescriptorKeys.length > 0) {
      findings.push(
        finding(
          "FED-DESCRIPTOR-001",
          repository,
          "descriptor",
          `Federation descriptor contains unknown fields: ${unknownDescriptorKeys.join(", ")}.`,
        ),
      );
    }
    if (!descriptorRoles.has(role)) {
      findings.push(
        finding("FED-ROLE-001", repository, "role", "Federation descriptor role must be contract_owner, platform_host or scenario_owner."),
      );
    }
    if (role !== "scenario_owner" && (descriptor.manifest !== undefined || descriptor.manifest_module !== undefined)) {
      findings.push(
        finding("FED-ROLE-002", repository, "manifest", "Only scenario_owner descriptors may expose a registrable scenario manifest."),
      );
    }
    if (role === "scenario_owner" && (descriptor.manifest === undefined || typeof descriptor.manifest !== "object")) {
      findings.push(
        finding("FED-ROLE-003", repository, "manifest", "Scenario owners must expose a concrete scenario manifest."),
      );
    }

    if (typeof descriptorNamespace !== "string" || !/^[a-z][a-z0-9_]*$/u.test(descriptorNamespace)) {
      findings.push(finding("FED-REF-001", repository, "platform_ref_namespace", "Platform canonical-ref namespace must be explicit lower snake_case."));
    } else if (platformRefNamespace && platformRefNamespace !== descriptorNamespace) {
      findings.push(finding("FED-REF-002", repository, "platform_ref_namespace", `Platform canonical-ref namespace conflicts with ${platformRefNamespace}.`));
    } else {
      platformRefNamespace = descriptorNamespace;
    }

    if (role === "scenario_owner" && (typeof scenarioKey !== "string" || !/^[a-z][a-z0-9-]*$/u.test(scenarioKey))) {
      findings.push(finding("FED-KEY-001", repository, "manifest.scenario_key", "Scenario key must be stable kebab-case."));
    } else if (role === "scenario_owner") {
      const existingOwner = scenarioOwners.get(scenarioKey);
      if (existingOwner && existingOwner !== repository) {
        findings.push(finding("FED-OWNER-001", repository, "manifest.scenario_key", `Scenario ${scenarioKey} is claimed by both ${existingOwner} and ${repository}.`));
      } else {
        scenarioOwners.set(scenarioKey, repository);
      }
    }

    if (role === "scenario_owner" && manifest.manifest_version >= 2 && !/^[a-f0-9]{64}$/u.test(manifest.contract?.source_hash ?? "")) {
      findings.push(finding("FED-HASH-001", repository, "manifest.contract.source_hash", "Federated releases require an exact lowercase SHA-256 logical source hash."));
    }

    if (role === "scenario_owner" && manifest.manifest_version !== 1 && manifest.manifest_version !== 2) {
      findings.push(finding("FED-MANIFEST-001", repository, "manifest.manifest_version", "Unsupported future manifest versions must fail closed."));
    }

    if (role === "scenario_owner" && manifest.manifest_version === 2) {
      if (!launchPhases.has(manifest.launch_phase)) {
        findings.push(finding("FED-ACTIVATION-001", repository, "manifest.launch_phase", "Scenario launch phase must use the closed release-metadata vocabulary."));
      }
      if (!scenarioLifecycleStatuses.has(manifest.scenario_record?.required_status)) {
        findings.push(finding("FED-ACTIVATION-002", repository, "manifest.scenario_record.required_status", "Pilot is canary activation, not a Scenario lifecycle status."));
      }
      for (const [index, capability] of (manifest.capabilities ?? []).entries()) {
        if (!capabilityEnablementPolicies.has(capability.enablement_policy)) {
          findings.push(finding("FED-ACTIVATION-003", repository, `manifest.capabilities.${index}.enablement_policy`, "Capability policy may only require Host workspace activation or remain disabled."));
        }
      }
    }

    for (const [index, userClass] of (role === "scenario_owner" ? (manifest.allowed_user_classes ?? []) : []).entries()) {
      if (!admittedUserClasses.has(userClass)) {
        findings.push(finding("FED-USER-001", repository, `manifest.allowed_user_classes.${index}`, `User class ${String(userClass)} is not approved for scenario admission.`));
      }
    }

    for (const [index, definition] of (role === "scenario_owner" ? (manifest.step_type_registry ?? []) : []).entries()) {
      if (!runtimeKinds.has(definition.runtime_kind)) {
        findings.push(finding("FED-STEP-001", repository, `manifest.step_type_registry.${index}.runtime_kind`, `Unknown runtime kind ${String(definition.runtime_kind)}.`));
      }
      if (definition.owner === "scenario" && !definition.step_type?.startsWith(`${scenarioKey}.`)) {
        findings.push(finding("FED-STEP-002", repository, `manifest.step_type_registry.${index}.step_type`, "Scenario-owned step types must be namespaced by canonical scenario key."));
      }
    }

    for (const [index, handoff] of (role === "scenario_owner" ? (manifest.handoffs ?? []) : []).entries()) {
      if (!handoffTypes.has(handoff.handoff_type)) {
        findings.push(finding("FED-HANDOFF-001", repository, `manifest.handoffs.${index}.handoff_type`, `Non-standard handoff type ${String(handoff.handoff_type)}.`));
      }
    }

    const eventRegistry = role === "scenario_owner" ? (manifest.event_registry ?? {}) : {};
    for (const [index, eventType] of (eventRegistry.scenario_internal_events ?? []).entries()) {
      if (!eventType.startsWith(`${scenarioKey}.`)) {
        findings.push(finding("FED-EVENT-001", repository, `manifest.event_registry.scenario_internal_events.${index}`, "Scenario event types must use the canonical scenario namespace."));
      }
    }
    if (eventRegistry.event_payload_policy && (
      eventRegistry.event_payload_policy.body !== "no_body" ||
      eventRegistry.event_payload_policy.pii !== "no_pii"
    )) {
      findings.push(finding("FED-EVENT-002", repository, "manifest.event_registry.event_payload_policy", "Cross-owner events must be bodyless and PII-free."));
    }
    for (const [eventType, producer] of Object.entries(eventRegistry.producers ?? {})) {
      const producerOwner = producer?.owner;
      if (eventType.startsWith("workflow.") || !eventType.startsWith(`${scenarioKey}.`)) {
        findings.push(
          finding(
            "FED-EVENT-004",
            repository,
            `manifest.event_registry.producers.${eventType}`,
            "Scenario owner outboxes may produce only events in the canonical scenario namespace; workflow.* is Host-owned.",
          ),
        );
      }
      const existingOwner = eventProducers.get(eventType);
      if (existingOwner && producerOwner && existingOwner !== producerOwner) {
        findings.push(finding("FED-EVENT-003", repository, `manifest.event_registry.producers.${eventType}`, `Event producer conflicts with canonical owner ${existingOwner}.`));
      } else if (typeof producerOwner === "string") {
        eventProducers.set(eventType, producerOwner);
      }
    }
    for (const [index, eventType] of (role === "scenario_owner" ? (manifest.governance?.outbox_events ?? []) : []).entries()) {
      if (typeof eventType !== "string" || eventType.startsWith("workflow.") || !eventType.startsWith(`${scenarioKey}.`)) {
        findings.push(
          finding(
            "FED-EVENT-005",
            repository,
            `manifest.governance.outbox_events.${index}`,
            "Scenario governance outbox declarations may contain only owner-namespaced events.",
          ),
        );
      }
    }

    for (const provider of descriptor.providers ?? []) {
      if (typeof provider === "string" && forbiddenProviders.has(provider.toLowerCase())) {
        findings.push(finding("FED-PROVIDER-001", repository, "providers", `Direct provider ${provider} is prohibited by the platform compliance overlay.`));
      }
    }

    for (const [index, alias] of (descriptor.scenario_aliases ?? []).entries()) {
      if (alias.allows_new_writes !== false) {
        findings.push(finding("FED-ALIAS-001", repository, `scenario_aliases.${index}`, "Scenario aliases are read/replay-only and must reject new writes."));
      }
      if (typeof alias.target !== "string" || !scenarioKeys.has(alias.target)) {
        findings.push(
          finding("FED-ALIAS-002", repository, `scenario_aliases.${index}.target`, "Scenario alias target must resolve to a declared canonical scenario."),
        );
      }
    }

    for (const [index, object] of (descriptor.canonical_objects ?? []).entries()) {
      const objectKey = object.key;
      const existingOwner = canonicalOwners.get(objectKey);
      if (existingOwner && existingOwner !== object.owner) {
        findings.push(finding("FED-OWNER-002", repository, `canonical_objects.${index}`, `Canonical object ${objectKey} has conflicting owners ${existingOwner} and ${object.owner}.`));
      } else if (typeof objectKey === "string" && typeof object.owner === "string") {
        canonicalOwners.set(objectKey, object.owner);
      }
    }

    if (role === "contract_owner") {
      const declared = new Set((descriptor.canonical_objects ?? []).map((object) => object.key));
      for (const objectKey of requiredContractObjects) {
        if (!declared.has(objectKey)) {
          findings.push(
            finding("FED-CONTRACT-001", repository, "canonical_objects", `Contract owner is missing normative object ${objectKey}.`),
          );
        }
      }
    }
  }

  return findings;
}

async function main() {
  const paths = process.argv.slice(2);
  if (paths.length === 0) {
    throw new Error("usage: semantic-lint.mjs <descriptor.json> [...descriptor.json]");
  }

  const descriptors = await Promise.all(paths.map(loadDescriptor));
  const findings = lintFederationDescriptors(descriptors);
  process.stdout.write(`${JSON.stringify({ passed: findings.length === 0, findings }, null, 2)}\n`);
  if (findings.length > 0) process.exitCode = 1;
}

async function loadDescriptor(path) {
  const descriptorPath = resolve(path);
  const descriptor = JSON.parse(await readFile(descriptorPath, "utf8"));
  if (!descriptor.manifest_module) return descriptor;
  const moduleKeys = Object.keys(descriptor.manifest_module);
  if (moduleKeys.some((key) => !["path", "export"].includes(key))) {
    throw new Error(`${path}: manifest_module contains unknown fields`);
  }
  const modulePath = resolve(descriptorPath, "..", descriptor.manifest_module.path);
  const sourceModule = await import(pathToFileURL(modulePath).href);
  const manifest = sourceModule[descriptor.manifest_module.export];
  if (!manifest || typeof manifest !== "object") {
    throw new Error(`${path}: export ${descriptor.manifest_module.export} is not a scenario manifest`);
  }
  return { ...descriptor, manifest };
}

if (
  process.argv[1] &&
  existsSync(resolve(process.argv[1])) &&
  realpathSync(resolve(process.argv[1])) ===
    realpathSync(fileURLToPath(import.meta.url))
) {
  await main();
}
