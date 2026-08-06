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
const clone = () => structuredClone(fixture);

const setPresentationComplete = (manifest) => {
  manifest.scenario_contracts.source_dependencies = [
    {
      source_identity: "platform_child_family_identity_source_v1",
      source_hash: "0123456789abcdef".repeat(4),
    },
    {
      source_identity: "scenario_interface_source_v1",
      source_hash: "fedcba9876543210".repeat(4),
    },
  ];
  manifest.scenario_contracts.capability_dependencies = [
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
  ];
  manifest.scenario_contracts.trusted_invocation.operations = [
    ["list_subject_contexts", "example.list_subject_contexts.input"],
    ["resolve_subject_context", "example.resolve_subject_context.input"],
    ["present_subject_context", "example.present_subject_context.input"],
  ].map(([operationKey, inputSchemaKey]) => ({
    endpoint_key: `example.${operationKey}`,
    method: "POST",
    operation_key: operationKey,
    input_schema_key: inputSchemaKey,
    input_schema_version: 1,
    handler_key: `example.${operationKey}.handler`,
    ingress: [{
      ingress_category: "product_surface",
      ingress_key: "example.dashboard",
      principal_origins: ["interactive_session"],
    }],
  }));
  manifest.scenario_contracts.subject_context_providers = [{
    provider_key: "example.subject_contexts",
    provider_version: 1,
    list_operation_key: "list_subject_contexts",
    resolve_operation_key: "resolve_subject_context",
    handler_key: "example.subject_contexts.handler",
  }];
  manifest.scenario_contracts.semantic_presentations = [{
    presentation_key: "example.subject_summary",
    presentation_version: 1,
    provider_key: "example.subject_contexts",
    operation_key: "present_subject_context",
    handler_key: "example.subject_summary.handler",
    safe_reason_codes: ["context_changed", "unavailable"],
  }];
  manifest.scenario_contracts.product_surfaces = [{
    product_surface_key: "example.dashboard",
    presentation_key: "example.subject_summary",
    view_modes: ["current", "recent", "history"],
    route_classes: ["subject_collection", "subject_detail"],
    action_offer_policy: "none",
    action_keys: [],
  }];
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

test("F2 accepts trusted-only and presentation-complete declarations", () => {
  assertBothAccept(clone());
  const presentationComplete = clone();
  setPresentationComplete(presentationComplete);
  assertBothAccept(presentationComplete);
});

test("F2 schema and runtime close declaration shapes", async (context) => {
  const cases = [
    ["unknown ingress field", "unknown_field", (value) => {
      value.scenario_contracts.trusted_invocation.operations[0].ingress[0].role = "operator";
    }],
    ["durable transition principal", "invalid_ingress_principal_origins", (value) => {
      value.scenario_contracts.trusted_invocation.operations[0].ingress[0].principal_origins = [
        "durable_run_actor",
      ];
    }],
    ["uppercase handler key", "invalid_scenario_declaration_key", (value) => {
      value.scenario_contracts.trusted_invocation.operations[0].handler_key = "Example.Handler";
    }],
    ["empty operations", "empty_trusted_operations", (value) => {
      value.scenario_contracts.trusted_invocation.operations = [];
    }],
    ["invalid safe reason", "invalid_safe_reason_code", (value) => {
      setPresentationComplete(value);
      value.scenario_contracts.semantic_presentations[0].safe_reason_codes = ["Context Changed"];
    }],
    ["none with action keys", "invalid_action_offer_policy", (value) => {
      setPresentationComplete(value);
      value.scenario_contracts.product_surfaces[0].action_keys = ["example.record"];
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

test("F2 runtime closes cross-declaration and capability drift", async (context) => {
  const cases = [
    ["presentation capability without declarations", "missing_presentation_declaration", (value) => {
      setPresentationComplete(value);
      value.scenario_contracts.subject_context_providers = [];
    }],
    ["declarations without presentation capability", "undeclared_presentation_capability", (value) => {
      setPresentationComplete(value);
      value.scenario_contracts.capability_dependencies.pop();
      value.scenario_contracts.source_dependencies.shift();
    }],
    ["dangling presentation provider", "missing_presentation_provider", (value) => {
      setPresentationComplete(value);
      value.scenario_contracts.semantic_presentations[0].provider_key = "example.missing_provider";
    }],
    ["missing provider operation", "missing_provider_operation", (value) => {
      setPresentationComplete(value);
      value.scenario_contracts.trusted_invocation.operations.shift();
    }],
    ["surface without matching ingress", "missing_product_surface_ingress", (value) => {
      setPresentationComplete(value);
      value.scenario_contracts.product_surfaces[0].product_surface_key = "example.other_surface";
    }],
    ["ingress without surface declaration", "missing_product_surface_declaration", (value) => {
      setPresentationComplete(value);
      value.scenario_contracts.trusted_invocation.operations[0].ingress[0].ingress_key =
        "example.other_surface";
    }],
    ["duplicate declaration handler", "duplicate_scenario_handler", (value) => {
      setPresentationComplete(value);
      value.scenario_contracts.trusted_invocation.operations[1].handler_key =
        value.scenario_contracts.trusted_invocation.operations[0].handler_key;
    }],
    ["duplicate operation key", "duplicate_trusted_operation_key", (value) => {
      setPresentationComplete(value);
      value.scenario_contracts.trusted_invocation.operations[1].operation_key =
        "list_subject_contexts";
    }],
    ["non-canonical view order", "invalid_view_mode_order", (value) => {
      setPresentationComplete(value);
      value.scenario_contracts.product_surfaces[0].view_modes.reverse();
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
