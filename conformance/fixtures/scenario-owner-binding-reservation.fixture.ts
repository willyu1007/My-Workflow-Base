import type {
  ScenarioOwnerBindingReservationRequestV1,
  ScenarioOwnerBindingReservationResultV1,
} from "@host/workflow-contracts";

export const scenarioOwnerBindingReservationRequestFixture = {
  reservation_request_version: 1,
  identity_operation_id: "identity-operation-01",
  binding_slot: "canonical.subject.primary",
  canonical_object_evidence_hash:
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  canonical_request_hash:
    "123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0",
} satisfies ScenarioOwnerBindingReservationRequestV1;

export const scenarioOwnerBindingReservationResultFixture = {
  reservation_result_version: 1,
  identity_operation_id: "identity-operation-01",
  disposition: "reserved",
  owner_binding: {
    owner_binding_ref_version: 1,
    binding_slot: "canonical.subject.primary",
    owner_ref: {
      schema_version: 1,
      namespace: "example_scenario",
      object_type: "canonical_binding_anchor",
      object_id: "anchor_01",
    },
  },
  reservation_version: 0,
  reservation_evidence_hash:
    "23456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef01",
} satisfies ScenarioOwnerBindingReservationResultV1;
