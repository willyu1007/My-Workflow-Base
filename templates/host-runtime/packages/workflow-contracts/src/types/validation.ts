import type { WorkflowActivationTarget } from "./identity.js";

export type WorkflowValidationSeverity = "fatal" | "warning" | "info";

export type WorkflowModuleValidationFinding = {
  rule_id: string;
  severity: WorkflowValidationSeverity;
  message: string;
  path?: string;
  owner?: string;
  remediation: string;
};

export type WorkflowModuleValidationReport = {
  scenario_key: string;
  contract_hash: string;
  activation_target: WorkflowActivationTarget;
  passed: boolean;
  findings: WorkflowModuleValidationFinding[];
};

export type WorkflowHostValidationSnapshot = {
  scenario_records: Record<string, { status: string; current_manifest_hash?: string }>;
  domain_resolver_keys: string[];
  downstream_owners: string[];
  standard_events: string[];
  platform_events: string[];
  allowed_surfaces: string[];
  projection_reviews: string[];
};
