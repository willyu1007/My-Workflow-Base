import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import {
  ScenarioManifestValidationError,
  assertScenarioManifestV2,
} from "@host/workflow-contracts";

const schemaRoot = new URL(
  "../../templates/host-runtime/packages/workflow-contracts/schemas/",
  import.meta.url,
);
const schemas = await Promise.all([
  "scenario-domain-action-contract-v1.schema.json",
  "scenario-protected-interaction-contract-v1.schema.json",
  "scenario-manifest-v2.schema.json",
].map(async (name) => JSON.parse(await readFile(new URL(name, schemaRoot), "utf8"))));
const baseManifest = JSON.parse(await readFile(
  new URL("../fixtures/scenario-contract-manifest-f1.valid.json", import.meta.url),
  "utf8",
));
const completeContracts = JSON.parse(await readFile(
  new URL("../fixtures/scenario-contract-manifest-f3.valid.json", import.meta.url),
  "utf8",
));

const ajv = new Ajv2020({ allErrors: true, strict: true });
for (const schema of schemas) ajv.addSchema(schema);
const validateManifest = ajv.getSchema(
  "https://morethan.local/contracts/scenario-manifest-v2.schema.json",
);
if (!validateManifest) throw new Error("scenario manifest schema was not registered");

const clone = (value) => structuredClone(value);
const complete = () => {
  const manifest = clone(baseManifest);
  manifest.scenario_contracts = clone(completeContracts);
  return manifest;
};
const actionOnly = () => {
  const manifest = complete();
  manifest.scenario_contracts.capability_dependencies.pop();
  manifest.scenario_contracts.source_dependencies.pop();
  manifest.scenario_contracts.protected_interaction_contracts = [];
  manifest.scenario_contracts.trusted_invocation.operations =
    manifest.scenario_contracts.trusted_invocation.operations.filter(
      (operation) => operation.operation_key !== "read_protected_detail",
    );
  return manifest;
};
const addSecondAction = (manifest, handlerKey = "example.record_two.handler") => {
  const action = clone(manifest.scenario_contracts.domain_action_contracts[0]);
  action.action_key = "example.record_two";
  action.input_schema_key = "example.record_two.input";
  action.target_ref_class = "example.record_two.target";
  action.handler_key = handlerKey;
  action.command_contract.command_key = "example.record_two.command";
  manifest.scenario_contracts.domain_action_contracts.push(action);
  manifest.scenario_contracts.product_surfaces[0].action_keys.push(action.action_key);
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

test("F3 accepts action-complete and protected-complete declaration graphs", () => {
  assertBothAccept(actionOnly());
  assertBothAccept(complete());
  const twoActions = actionOnly();
  addSecondAction(twoActions);
  assertBothAccept(twoActions);
});

test("F3 reuses exact I1-D and I1-E static declaration shapes", async (context) => {
  const cases = [
    ["third action driver", "invalid_domain_action_contract", (value) => {
      value.scenario_contracts.domain_action_contracts[0].driver = "surface_selected_v1";
    }],
    ["action authority field", "invalid_domain_action_contract", (value) => {
      value.scenario_contracts.domain_action_contracts[0].role = "operator";
    }],
    ["too many surface action keys", "too_many_items", (value) => {
      value.scenario_contracts.product_surfaces[0].action_keys =
        Array.from({ length: 129 }, (_, index) => `example.action_${index}`);
    }],
    ["protected body", "invalid_protected_interaction_contract", (value) => {
      value.scenario_contracts.protected_interaction_contracts[0].body = "not-allowed";
    }],
    ["protected commit operation", "invalid_protected_interaction_contract", (value) => {
      value.scenario_contracts.protected_interaction_contracts[0].commit_operation_key =
        "commit_protected_detail";
    }],
  ];
  for (const [name, code, mutate] of cases) {
    await context.test(name, () => {
      const value = complete();
      mutate(value);
      assertBothReject(value, code);
    });
  }
});

test("F3 runtime closes action capability and bidirectional references", async (context) => {
  const cases = [
    ["action capability without rows", "missing_domain_action_declaration", (value) => {
      value.scenario_contracts.domain_action_contracts = [];
      value.scenario_contracts.product_surfaces[0].action_offer_policy = "none";
      value.scenario_contracts.product_surfaces[0].action_keys = [];
    }],
    ["action rows without capability", "undeclared_domain_action_capability", (value) => {
      value.scenario_contracts.capability_dependencies =
        value.scenario_contracts.capability_dependencies.slice(0, 2);
      value.scenario_contracts.source_dependencies =
        value.scenario_contracts.source_dependencies.slice(0, 2);
      value.scenario_contracts.protected_interaction_contracts = [];
    }],
    ["action scenario mismatch", "domain_action_scenario_mismatch", (value) => {
      value.scenario_contracts.domain_action_contracts[0].scenario_key = "other";
    }],
    ["surface action without row", "missing_domain_action_declaration", (value) => {
      value.scenario_contracts.product_surfaces[0].action_keys = [
        "example.record",
        "example.missing",
      ];
    }],
    ["action without surface", "missing_domain_action_surface", (value) => {
      value.scenario_contracts.product_surfaces[0].action_offer_policy = "none";
      value.scenario_contracts.product_surfaces[0].action_keys = [];
    }],
    ["undeclared action ingress", "missing_domain_action_ingress", (value) => {
      value.scenario_contracts.domain_action_contracts[0].entitled_ingress_keys = ["example.other"];
    }],
    ["offering surface not entitled", "missing_domain_action_surface_ingress", (value) => {
      const prepare = value.scenario_contracts.trusted_invocation.operations.find(
        (operation) => operation.operation_key === "prepare_domain_action",
      );
      prepare.ingress.push({
        ingress_category: "workflow_runtime",
        ingress_key: "example.workflow",
        principal_origins: ["durable_run_actor"],
      });
      value.scenario_contracts.domain_action_contracts[0].entitled_ingress_keys = [
        "example.workflow",
      ];
    }],
    ["missing prepare operation", "missing_domain_action_handler", (value) => {
      value.scenario_contracts.trusted_invocation.operations =
        value.scenario_contracts.trusted_invocation.operations.filter(
          (operation) => operation.operation_key !== "prepare_domain_action",
        );
    }],
    ["action handler collides with transport handler", "duplicate_scenario_handler", (value) => {
      value.scenario_contracts.domain_action_contracts[0].handler_key =
        "example.prepare_domain_action.handler";
    }],
    ["two actions share one handler", "duplicate_scenario_handler", (value) => {
      addSecondAction(
        value,
        value.scenario_contracts.domain_action_contracts[0].handler_key,
      );
    }],
  ];
  for (const [name, code, mutate] of cases) {
    await context.test(name, () => {
      const value = actionOnly();
      mutate(value);
      assertRuntimeOnlyRejects(value, code);
    });
  }
});

test("F3 runtime closes protected capability and action/operation references", async (context) => {
  const cases = [
    ["protected capability without rows", "missing_protected_interaction_declaration", (value) => {
      value.scenario_contracts.protected_interaction_contracts = [];
    }],
    ["protected rows without capability", "undeclared_protected_interaction_capability", (value) => {
      value.scenario_contracts.capability_dependencies.pop();
      value.scenario_contracts.source_dependencies.pop();
    }],
    ["protected scenario mismatch", "protected_interaction_scenario_mismatch", (value) => {
      value.scenario_contracts.protected_interaction_contracts[0].scenario_key = "other";
    }],
    ["protected dangling action", "missing_protected_domain_action", (value) => {
      value.scenario_contracts.protected_interaction_contracts[0].action_key = "example.missing";
    }],
    ["protected missing read operation", "missing_protected_operation", (value) => {
      value.scenario_contracts.trusted_invocation.operations =
        value.scenario_contracts.trusted_invocation.operations.filter(
          (operation) => operation.operation_key !== "read_protected_detail",
        );
    }],
    ["duplicate protected action and field", "duplicate_protected_interaction", (value) => {
      value.scenario_contracts.protected_interaction_contracts.push(
        clone(value.scenario_contracts.protected_interaction_contracts[0]),
      );
    }],
  ];
  for (const [name, code, mutate] of cases) {
    await context.test(name, () => {
      const value = complete();
      mutate(value);
      assertRuntimeOnlyRejects(value, code);
    });
  }
});
