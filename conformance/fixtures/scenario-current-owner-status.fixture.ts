import type {
  CanonicalRef,
  ScenarioCurrentOwnerBindingPairEvidenceV1,
  ScenarioIdentityOperationStatusLookupRequestV1,
  ScenarioIdentityOperationStatusLookupResultV1,
  ScenarioOwnerBindingRefV1,
} from "@host/workflow-contracts";

const ref = (namespace: string, objectType: string, objectId: string): CanonicalRef => ({
  schema_version: 1,
  namespace,
  object_type: objectType,
  object_id: objectId,
});

const ownerBindings: [ScenarioOwnerBindingRefV1, ScenarioOwnerBindingRefV1] = [
  {
    owner_binding_ref_version: 1,
    binding_slot: "canonical.context.primary",
    owner_ref: ref("example_scenario", "binding_anchor", "context_anchor_01"),
  },
  {
    owner_binding_ref_version: 1,
    binding_slot: "canonical.subject.primary",
    owner_ref: ref("example_scenario", "binding_anchor", "subject_anchor_01"),
  },
];

export const scenarioCurrentOwnerBindingPairEvidenceFixture = {
  binding_evidence_version: 1,
  purpose_key: "identity.current-owner-evidence",
  owner_bindings: ownerBindings,
  pair_relation_evidence_hash:
    "89abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567",
  current_owner_evidence_hash:
    "9abcdef0123456789abcdef0123456789abcdef0123456789abcdef012345678",
} satisfies ScenarioCurrentOwnerBindingPairEvidenceV1;

export const scenarioIdentityOperationStatusLookupRequestFixture = {
  status_lookup_request_version: 1,
  identity_operation_id: "identity-operation-pair-01",
  owner_bindings: ownerBindings,
  association_expectation_hash:
    "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
  scenario_command_id: "scenario-command-01",
  scenario_command_hash:
    "bcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789a",
  principal_provenance_hash:
    "cdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab",
  host_identity_evidence_hash:
    "def0123456789abcdef0123456789abcdef0123456789abcdef0123456789abc",
  deadline_evidence_hash:
    "ef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcd",
  attempt_ledger_hash:
    "f0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcde",
} satisfies ScenarioIdentityOperationStatusLookupRequestV1;

const statusResultCommon = {
  status_lookup_result_version: 1 as const,
  identity_operation_id: "identity-operation-pair-01",
  scenario_command_id: "scenario-command-01",
  checked_at: "2026-08-05T09:30:00.000Z",
  request_nonce_hash:
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
};

export const scenarioIdentityOperationStatusLookupResultFixtures = [
  {
    ...statusResultCommon,
    status: "committed",
    scenario_execution_ref: ref("example_scenario", "scenario_execution", "execution_01"),
    scenario_commit_evidence_hash:
      "123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0",
  },
  {
    ...statusResultCommon,
    status: "confirmed_no_effect",
    no_effect_fence_evidence_hash:
      "23456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef01",
  },
  {
    ...statusResultCommon,
    status: "unknown",
    reason_code: "owner_unavailable",
  },
] satisfies ScenarioIdentityOperationStatusLookupResultV1[];
