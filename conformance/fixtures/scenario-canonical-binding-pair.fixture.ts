import type {
  CanonicalRef,
  ScenarioCanonicalBindingPairRequestV1,
  ScenarioCanonicalBindingPairResultV1,
} from "@host/workflow-contracts";

const ref = (namespace: string, objectType: string, objectId: string): CanonicalRef => ({
  schema_version: 1,
  namespace,
  object_type: objectType,
  object_id: objectId,
});

const contextObjectRef = ref("example_platform", "canonical_context", "context_01");
const subjectObjectRef = ref("example_platform", "canonical_subject", "subject_01");
const contextOwnerRef = ref("example_scenario", "binding_anchor", "context_anchor_01");
const subjectOwnerRef = ref("example_scenario", "binding_anchor", "subject_anchor_01");
const contextBindingRef = ref("example_platform", "scenario_binding", "binding_context_01");
const subjectBindingRef = ref("example_platform", "scenario_binding", "binding_subject_01");

export const scenarioCanonicalBindingPairRequestFixture = {
  pair_request_version: 1,
  identity_operation_id: "identity-operation-pair-01",
  workspace_ref: ref("example_platform", "workspace", "workspace_01"),
  scenario_key: "example-scenario",
  principal_provenance_hash:
    "3456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef012",
  continuation_context_hash:
    "456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123",
  pair_relation_evidence_hash:
    "56789abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234",
  canonical_input_hash:
    "6789abcdef0123456789abcdef0123456789abcdef0123456789abcdef012345",
  bindings: [
    {
      binding_intent_version: 1,
      binding_slot: "canonical.context.primary",
      canonical_object_ref: contextObjectRef,
      scenario_owner_ref: contextOwnerRef,
      expected_head: {
        state: "bound",
        binding_ref: contextBindingRef,
        binding_version: 3,
        owner_ref: contextOwnerRef,
      },
    },
    {
      binding_intent_version: 1,
      binding_slot: "canonical.subject.primary",
      canonical_object_ref: subjectObjectRef,
      scenario_owner_ref: subjectOwnerRef,
      expected_head: { state: "absent" },
    },
  ],
} satisfies ScenarioCanonicalBindingPairRequestV1;

export const scenarioCanonicalBindingPairResultFixture = {
  pair_result_version: 1,
  identity_operation_id: "identity-operation-pair-01",
  canonical_input_hash:
    "6789abcdef0123456789abcdef0123456789abcdef0123456789abcdef012345",
  disposition: "committed",
  bindings: [
    {
      binding_result_version: 1,
      binding_slot: "canonical.context.primary",
      canonical_object_ref: contextObjectRef,
      scenario_owner_ref: contextOwnerRef,
      binding_ref: contextBindingRef,
      binding_version: 3,
      effect: "reused",
    },
    {
      binding_result_version: 1,
      binding_slot: "canonical.subject.primary",
      canonical_object_ref: subjectObjectRef,
      scenario_owner_ref: subjectOwnerRef,
      binding_ref: subjectBindingRef,
      binding_version: 0,
      effect: "created",
    },
  ],
  pair_commit_evidence_hash:
    "789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456",
} satisfies ScenarioCanonicalBindingPairResultV1;
