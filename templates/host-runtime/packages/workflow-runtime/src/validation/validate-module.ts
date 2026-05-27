import type {
  WorkflowActivationTarget,
  WorkflowHostValidationSnapshot,
  WorkflowModuleValidationFinding,
  WorkflowModuleValidationReport,
  WorkflowScenarioModule,
} from "@host/workflow-contracts";
import { createHash } from "node:crypto";

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function computeContractHash(module: WorkflowScenarioModule): string {
  const normalized = {
    manifest: module.manifest,
    handler_keys: Object.keys(module.handlers).sort(),
    action_keys: Object.keys(module.actions).sort(),
    policy_keys: Object.keys(module.policies).sort(),
    internal_api_handler_keys: Object.keys(module.internal_api_handlers).sort(),
    adapter_keys: Object.keys(module.adapters).sort(),
    presenter_keys: Object.keys(module.presenters).sort(),
  };

  return createHash("sha256").update(stableStringify(normalized)).digest("hex");
}

function addFatal(
  findings: WorkflowModuleValidationFinding[],
  input: Omit<WorkflowModuleValidationFinding, "severity">,
): void {
  findings.push({ ...input, severity: "fatal" });
}

export function validateWorkflowModule(input: {
  module: WorkflowScenarioModule;
  host_snapshot: WorkflowHostValidationSnapshot;
  activation_target: WorkflowActivationTarget;
}): WorkflowModuleValidationReport {
  const findings: WorkflowModuleValidationFinding[] = [];
  const manifest = input.module.manifest;
  const contract_hash = computeContractHash(input.module);
  const scenarioRecord = input.host_snapshot.scenario_records[manifest.scenario_key];

  if (!scenarioRecord) {
    addFatal(findings, {
      rule_id: "WF-MAN-001",
      message: "Canonical Scenario record is missing.",
      path: "scenario_key",
      remediation: "Create or publish the Scenario record before activation.",
    });
  } else {
    if (scenarioRecord.status !== manifest.scenario_record.required_status) {
      addFatal(findings, {
        rule_id: "WF-MAN-002",
        message: "Canonical Scenario record status does not match manifest requirement.",
        path: "scenario_record.required_status",
        remediation: "Align the Scenario record status or manifest activation target before registration.",
      });
    }

    if (scenarioRecord.current_manifest_hash && scenarioRecord.current_manifest_hash !== contract_hash) {
      addFatal(findings, {
        rule_id: "WF-MAN-003",
        message: "Canonical Scenario manifest hash does not match the module contract hash.",
        path: "scenario_record.current_manifest_hash",
        remediation: "Publish the new contract hash before pilot or GA activation.",
      });
    }
  }

  for (const capability of manifest.capabilities) {
    for (const entrypoint of capability.entrypoints) {
      for (const step of entrypoint.steps) {
        if (!input.module.handlers[step.handler_key]) {
          addFatal(findings, {
            rule_id: "WF-MAN-010",
            message: `Step handler is missing: ${step.handler_key}`,
            path: `capabilities.${capability.capability_key}.${entrypoint.entrypoint_key}.${step.step_key}`,
            remediation: "Register a TypeScript handler for every manifest step.",
          });
        }
      }
    }
  }

  for (const action of manifest.action_availability.scenario_actions) {
    if (!input.module.actions[action]) {
      addFatal(findings, {
        rule_id: "WF-MAN-011",
        message: `Scenario action handler is missing: ${action}`,
        path: "action_availability.scenario_actions",
        remediation: "Register every scenario-specific action handler.",
      });
    }
  }

  for (const route of manifest.internal_api.routes) {
    if (!["web_domain_workbench", "web_run_workbench", "admin_operator"].includes(route.owner_surface)) {
      addFatal(findings, {
        rule_id: "WF-MAN-020",
        message: "Internal API route owner must be Web/Admin only.",
        path: `internal_api.routes.${route.path}`,
        remediation: "Move the operation to a standard adapter or change the owner surface.",
      });
    }

    if (!input.module.internal_api_handlers[route.handler_key]) {
      addFatal(findings, {
        rule_id: "WF-MAN-021",
        message: `Internal API handler is missing: ${route.handler_key}`,
        path: `internal_api.routes.${route.path}`,
        remediation: "Register every declared internal API handler in the TS registry.",
      });
    }
  }

  for (const contextRefType of manifest.scenario_data.context_ref_types) {
    if (!input.host_snapshot.domain_resolver_keys.includes(contextRefType.resolver_key)) {
      addFatal(findings, {
        rule_id: "WF-MAN-030",
        message: `Domain context resolver is missing: ${contextRefType.resolver_key}`,
        path: "scenario_data.context_ref_types",
        remediation: "Register the resolver in the host domain registry before activation.",
      });
    }
  }

  for (const intervention of manifest.scenario_data.step_interventions) {
    if (intervention.surface !== "web_run_workbench") {
      addFatal(findings, {
        rule_id: "WF-MAN-031",
        message: "Step interventions must be restricted to web_run_workbench.",
        path: "scenario_data.step_interventions",
        remediation: "Move chat/mobile operations to start requirements or standard actions.",
      });
    }
  }

  for (const handoff of manifest.handoffs) {
    if (!handoff.receipt_required) {
      addFatal(findings, {
        rule_id: "WF-MAN-040",
        message: `Handoff receipt is not required: ${handoff.handoff_type}`,
        path: "handoffs",
        remediation: "Require downstream receipts for every workflow handoff.",
      });
    }

    if (!input.module.policies[handoff.policy_key]) {
      addFatal(findings, {
        rule_id: "WF-MAN-041",
        message: `Handoff policy is missing: ${handoff.policy_key}`,
        path: "handoffs",
        remediation: "Register every handoff policy key in the scenario policy registry.",
      });
    }

    if (!input.host_snapshot.downstream_owners.includes(handoff.downstream_owner)) {
      addFatal(findings, {
        rule_id: "WF-MAN-042",
        message: `Downstream owner is not registered: ${handoff.downstream_owner}`,
        path: "handoffs",
        remediation: "Register the downstream owner in the host handoff registry.",
      });
    }
  }

  const registeredEvents = new Set([
    ...(manifest.event_registry.platform_events ?? []),
    ...manifest.event_registry.standard_workflow_events,
    ...manifest.event_registry.scenario_internal_events,
  ]);
  const scenarioInternalEvents = new Set(manifest.event_registry.scenario_internal_events);

  for (const standardEvent of manifest.event_registry.standard_workflow_events) {
    if (!input.host_snapshot.standard_events.includes(standardEvent)) {
      addFatal(findings, {
        rule_id: "WF-MAN-051",
        message: `Standard workflow event is not registered by host: ${standardEvent}`,
        path: "event_registry.standard_workflow_events",
        remediation: "Use a host-supported standard workflow event or register it before activation.",
      });
    }
  }

  for (const platformEvent of manifest.event_registry.platform_events ?? []) {
    if (!input.host_snapshot.platform_events.includes(platformEvent)) {
      addFatal(findings, {
        rule_id: "WF-MAN-052",
        message: `Platform event is not registered by host: ${platformEvent}`,
        path: "event_registry.platform_events",
        remediation: "Use a host-supported platform event or register it before activation.",
      });
    }
  }

  if (
    manifest.event_registry.event_payload_policy.body !== "no_body" ||
    manifest.event_registry.event_payload_policy.pii !== "no_pii" ||
    manifest.event_registry.event_payload_policy.status_in_payload !== false ||
    manifest.event_registry.event_payload_policy.presenter_output_in_payload !== false
  ) {
    addFatal(findings, {
      rule_id: "WF-MAN-050",
      message: "Workflow event payload policy must be refs-only and bodyless.",
      path: "event_registry.event_payload_policy",
      remediation: "Set body=no_body, pii=no_pii, and remove status/presenter output from payloads.",
    });
  }

  for (const outboxEvent of manifest.governance.outbox_events) {
    if (!registeredEvents.has(outboxEvent)) {
      addFatal(findings, {
        rule_id: "WF-MAN-060",
        message: `Outbox event is not registered: ${outboxEvent}`,
        path: "governance.outbox_events",
        remediation: "Add every outbox event to the event registry.",
      });
    }

    if (!manifest.event_registry.producers[outboxEvent]) {
      addFatal(findings, {
        rule_id: "WF-MAN-061",
        message: `Outbox event producer is missing: ${outboxEvent}`,
        path: "event_registry.producers",
        remediation: "Declare the canonical producer for every outbox event.",
      });
    }
  }

  for (const [consumer, declaration] of Object.entries(manifest.event_registry.consumers)) {
    for (const allowedEvent of declaration.allowed_events) {
      if (scenarioInternalEvents.has(allowedEvent)) {
        addFatal(findings, {
          rule_id: "WF-MAN-062",
          message: `Shared consumer depends on scenario internal event: ${consumer}`,
          path: `event_registry.consumers.${consumer}`,
          remediation: "Route shared consumers to platform or standard workflow events only.",
        });
      }

      if (!allowedEvent.endsWith(".*") && !registeredEvents.has(allowedEvent)) {
        addFatal(findings, {
          rule_id: "WF-MAN-063",
          message: `Consumer allowed event is not registered: ${allowedEvent}`,
          path: `event_registry.consumers.${consumer}`,
          remediation: "Register the event or remove it from the consumer allow-list.",
        });
      }
    }
  }

  if (manifest.governance.projection_review_required && input.activation_target !== "dev") {
    const hasProjectionReview = input.host_snapshot.projection_reviews.includes(manifest.scenario_key);
    if (!hasProjectionReview) {
      addFatal(findings, {
        rule_id: "WF-MAN-070",
        message: "Projection review is required before pilot or GA activation.",
        path: "governance.projection_review_required",
        remediation: "Add a projection review record before activating this scenario.",
      });
    }
  }

  if (manifest.verification.deterministic_tests.length === 0 || !manifest.verification.journey_harness) {
    addFatal(findings, {
      rule_id: "WF-MAN-080",
      message: "Deterministic tests and a journey harness are required.",
      path: "verification",
      remediation: "Add at least one deterministic test and one journey harness before activation.",
    });
  }

  for (const requirement of manifest.scenario_data.run_start_requirements) {
    for (const surface of requirement.surfaces) {
      if (!input.host_snapshot.allowed_surfaces.includes(surface)) {
        addFatal(findings, {
          rule_id: "WF-MAN-090",
          message: `Run start requirement references unsupported surface: ${surface}`,
          path: "scenario_data.run_start_requirements",
          remediation: "Use a host-supported standard surface.",
        });
      }
    }
  }

  for (const surface of Object.keys(manifest.surface_mapping)) {
    if (!input.host_snapshot.allowed_surfaces.includes(surface)) {
      addFatal(findings, {
        rule_id: "WF-MAN-091",
        message: `Surface mapping references unsupported surface: ${surface}`,
        path: "surface_mapping",
        remediation: "Use a host-supported standard surface.",
      });
    }
  }

  const surfaceMapping = manifest.surface_mapping;
  if (surfaceMapping.chat_workflow_control && !input.module.adapters.chat_workflow_control) {
    addFatal(findings, {
      rule_id: "WF-MAN-092",
      message: "Chat workflow control adapter is missing.",
      path: "surface_mapping.chat_workflow_control",
      remediation: "Register the chat workflow control adapter.",
    });
  }
  if (surfaceMapping.web_run_workbench && !input.module.adapters.web_run_workbench) {
    addFatal(findings, {
      rule_id: "WF-MAN-093",
      message: "Web run workbench adapter is missing.",
      path: "surface_mapping.web_run_workbench",
      remediation: "Register the web run workbench adapter.",
    });
  }
  if (surfaceMapping.mobile_dashboard && !input.module.adapters.mobile_dashboard) {
    addFatal(findings, {
      rule_id: "WF-MAN-094",
      message: "Mobile dashboard adapter is missing.",
      path: "surface_mapping.mobile_dashboard",
      remediation: "Register the mobile dashboard adapter.",
    });
  }
  if (surfaceMapping.admin_operator && !input.module.adapters.admin_operator) {
    addFatal(findings, {
      rule_id: "WF-MAN-095",
      message: "Admin operator adapter is missing.",
      path: "surface_mapping.admin_operator",
      remediation: "Register the admin operator adapter.",
    });
  }

  return {
    scenario_key: manifest.scenario_key,
    contract_hash,
    activation_target: input.activation_target,
    passed: findings.every((finding) => finding.severity !== "fatal"),
    findings,
  };
}
