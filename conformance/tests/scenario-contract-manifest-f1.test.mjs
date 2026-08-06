import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import {
  ScenarioManifestValidationError,
  assertScenarioManifestV2,
} from "@host/workflow-contracts";

const schema = JSON.parse(await readFile(
  new URL(
    "../../templates/host-runtime/packages/workflow-contracts/schemas/scenario-manifest-v2.schema.json",
    import.meta.url,
  ),
  "utf8",
));
const fixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-contract-manifest-f1.valid.json", import.meta.url),
  "utf8",
));
const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateManifest = ajv.compile(schema);
const clone = (value = fixture) => structuredClone(value);

const capabilityRows = [
  {
    capability_key: "trusted_scenario_invocation_v1",
    requires_capabilities: [],
    requires_sources: ["scenario_interface_source_v1"],
  },
  {
    capability_key: "scenario_subject_presentation_v1",
    requires_capabilities: ["trusted_scenario_invocation_v1"],
    requires_sources: [
      "platform_child_family_identity_source_v1",
      "scenario_interface_source_v1",
    ],
  },
  {
    capability_key: "scenario_domain_action_execution_v1",
    requires_capabilities: [
      "trusted_scenario_invocation_v1",
      "scenario_subject_presentation_v1",
    ],
    requires_sources: ["scenario_domain_action_source_v1"],
  },
  {
    capability_key: "scenario_protected_interaction_v1",
    requires_capabilities: [
      "trusted_scenario_invocation_v1",
      "scenario_subject_presentation_v1",
      "scenario_domain_action_execution_v1",
    ],
    requires_sources: ["scenario_protected_interaction_source_v1"],
  },
];
const sourceOrder = [
  "platform_child_family_identity_source_v1",
  "scenario_interface_source_v1",
  "scenario_domain_action_source_v1",
  "scenario_protected_interaction_source_v1",
];

const presentationOperations = [
  ["list_subject_contexts", "example.list_contexts.input", "example.list_contexts.handler"],
  ["resolve_subject_context", "example.resolve_context.input", "example.resolve_context.handler"],
  ["present_subject_context", "example.present_context.input", "example.present_context.handler"],
].map(([operationKey, inputSchemaKey, handlerKey]) => ({
  endpoint_key: `example.${operationKey}`,
  method: "POST",
  operation_key: operationKey,
  input_schema_key: inputSchemaKey,
  input_schema_version: 1,
  handler_key: handlerKey,
  ingress: [
    {
      ingress_category: "product_surface",
      ingress_key: "example.dashboard",
      principal_origins: ["interactive_session"],
    },
  ],
}));

const setPresentationDeclarations = (manifest, present) => {
  if (!present) {
    manifest.scenario_contracts.trusted_invocation.operations = [
      structuredClone(fixture.scenario_contracts.trusted_invocation.operations[0]),
    ];
    manifest.scenario_contracts.subject_context_providers = [];
    manifest.scenario_contracts.semantic_presentations = [];
    manifest.scenario_contracts.product_surfaces = [];
    return;
  }
  manifest.scenario_contracts.trusted_invocation.operations = structuredClone(presentationOperations);
  manifest.scenario_contracts.subject_context_providers = [
    {
      provider_key: "example.subject_contexts",
      provider_version: 1,
      list_operation_key: "list_subject_contexts",
      resolve_operation_key: "resolve_subject_context",
      handler_key: "example.subject_contexts.handler",
    },
  ];
  manifest.scenario_contracts.semantic_presentations = [
    {
      presentation_key: "example.subject_summary",
      presentation_version: 1,
      provider_key: "example.subject_contexts",
      operation_key: "present_subject_context",
      handler_key: "example.subject_summary.handler",
      safe_reason_codes: ["context_changed", "unavailable"],
    },
  ];
  manifest.scenario_contracts.product_surfaces = [
    {
      product_surface_key: "example.dashboard",
      presentation_key: "example.subject_summary",
      view_modes: ["current", "recent", "history"],
      route_classes: ["subject_collection", "subject_detail"],
      action_offer_policy: "none",
      action_keys: [],
    },
  ];
};

const setPrefix = (manifest, length) => {
  const rows = capabilityRows.slice(0, length);
  const requiredSources = new Set(rows.flatMap((row) => row.requires_sources));
  manifest.scenario_contracts.capability_dependencies = structuredClone(rows);
  manifest.scenario_contracts.source_dependencies = sourceOrder
    .filter((sourceIdentity) => requiredSources.has(sourceIdentity))
    .map((sourceIdentity, index) => ({
      source_identity: sourceIdentity,
      source_hash: String(index + 1).repeat(64),
    }));
  setPresentationDeclarations(manifest, length >= 2);
};

const assertBothAccept = (value) => {
  assert.equal(validateManifest(value), true, JSON.stringify(validateManifest.errors));
  assert.doesNotThrow(() => assertScenarioManifestV2(value));
};

const assertBothReject = (value, code) => {
  assert.equal(validateManifest(value), false, "JSON Schema unexpectedly accepted mutation");
  assert.throws(
    () => assertScenarioManifestV2(value),
    (error) => error instanceof ScenarioManifestValidationError && error.code === code,
  );
};

const assertRuntimeOnlyRejects = (value, code) => {
  assert.equal(validateManifest(value), true, JSON.stringify(validateManifest.errors));
  assert.throws(
    () => assertScenarioManifestV2(value),
    (error) => error instanceof ScenarioManifestValidationError && error.code === code,
  );
};

test("F1 preserves v2 omission and accepts every dependency-complete prefix", () => {
  const legacyV2 = clone();
  delete legacyV2.scenario_contracts;
  assertBothAccept(legacyV2);

  for (let length = 1; length <= capabilityRows.length; length += 1) {
    const value = clone();
    setPrefix(value, length);
    assertBothAccept(value);
  }
});

test("F1 schema and runtime close primitive envelope mutations", async (context) => {
  const cases = [
    ["unknown envelope field", "unknown_field", (value) => {
      value.scenario_contracts.legacy_fallback = true;
    }],
    ["missing source hash", "missing_field", (value) => {
      delete value.scenario_contracts.source_dependencies[0].source_hash;
    }],
    ["unknown source identity", "invalid_source_identity", (value) => {
      value.scenario_contracts.source_dependencies[0].source_identity = "umbrella_source_v1";
    }],
    ["uppercase source hash", "invalid_source_hash", (value) => {
      value.scenario_contracts.source_dependencies[0].source_hash = "B".repeat(64);
    }],
    ["unknown capability", "invalid_scenario_capability", (value) => {
      value.scenario_contracts.capability_dependencies[0].capability_key = "umbrella_capability_v1";
    }],
    ["duplicate required source", "duplicate_value", (value) => {
      value.scenario_contracts.capability_dependencies[0].requires_sources.push(
        "scenario_interface_source_v1",
      );
    }],
  ];

  for (const [name, code, mutate] of cases) {
    await context.test(name, () => {
      const value = clone();
      mutate(value);
      assertBothReject(value, code);
    });
  }
});

test("F1 runtime closes contextual graph and source-set failures", async (context) => {
  const cases = [
    ["non-prefix graph", "invalid_capability_prefix", (value) => {
      value.scenario_contracts.capability_dependencies = [structuredClone(capabilityRows[1])];
      setPrefix(value, 2);
      value.scenario_contracts.capability_dependencies.shift();
    }],
    ["missing capability dependency", "missing_capability_dependency", (value) => {
      setPrefix(value, 2);
      value.scenario_contracts.capability_dependencies[1].requires_capabilities = [
        "scenario_domain_action_execution_v1",
      ];
    }],
    ["dependency cycle", "cyclic_capability_dependency", (value) => {
      setPrefix(value, 2);
      value.scenario_contracts.capability_dependencies[0].requires_capabilities = [
        "scenario_subject_presentation_v1",
      ];
    }],
    ["missing source", "missing_source_dependency", (value) => {
      setPrefix(value, 2);
      value.scenario_contracts.source_dependencies.shift();
    }],
    ["stale source", "stale_source_dependency", (value) => {
      value.scenario_contracts.source_dependencies.unshift({
        source_identity: "platform_child_family_identity_source_v1",
        source_hash: "c".repeat(64),
      });
    }],
    ["duplicate source identity", "duplicate_source_dependency", (value) => {
      value.scenario_contracts.source_dependencies.push({
        source_identity: "scenario_interface_source_v1",
        source_hash: "d".repeat(64),
      });
    }],
    ["non-canonical source order", "invalid_source_dependency_order", (value) => {
      setPrefix(value, 2);
      value.scenario_contracts.source_dependencies.reverse();
    }],
    ["umbrella dependency substitution", "invalid_source_dependency_set", (value) => {
      setPrefix(value, 2);
      value.scenario_contracts.capability_dependencies[1].requires_sources = [
        "scenario_interface_source_v1",
      ];
      value.scenario_contracts.source_dependencies = [
        value.scenario_contracts.source_dependencies[1],
      ];
    }],
  ];

  for (const [name, code, mutate] of cases) {
    await context.test(name, () => {
      const value = clone();
      mutate(value);
      assertRuntimeOnlyRejects(value, code);
    });
  }
});
