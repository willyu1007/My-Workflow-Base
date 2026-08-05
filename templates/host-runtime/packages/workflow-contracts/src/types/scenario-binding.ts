import type { CanonicalRef } from "./identity.js";

export const scenarioOwnerBindingReservationDispositions = ["reserved", "exact_replay"] as const;
export type ScenarioOwnerBindingReservationDisposition =
  (typeof scenarioOwnerBindingReservationDispositions)[number];

/**
 * Scenario-owned endpoint for one registered canonical-object binding slot.
 * The reference carries no business body and grants no read/write authority.
 */
export type ScenarioOwnerBindingRefV1 = {
  owner_binding_ref_version: 1;
  binding_slot: string;
  owner_ref: CanonicalRef;
};

/**
 * Scenario-private reservation input. Canonical object identity remains inside
 * the Host owner and contributes only to the opaque keyed evidence hash.
 */
export type ScenarioOwnerBindingReservationRequestV1 = {
  reservation_request_version: 1;
  identity_operation_id: string;
  binding_slot: string;
  canonical_object_evidence_hash: string;
  canonical_request_hash: string;
};

export type ScenarioOwnerBindingReservationResultV1 = {
  reservation_result_version: 1;
  identity_operation_id: string;
  disposition: ScenarioOwnerBindingReservationDisposition;
  owner_binding: ScenarioOwnerBindingRefV1;
  reservation_version: number;
  reservation_evidence_hash: string;
};

export type ScenarioCanonicalBindingExpectedHeadV1 =
  | { state: "absent" }
  | {
      state: "bound";
      binding_ref: CanonicalRef;
      binding_version: number;
      owner_ref: CanonicalRef;
    };

export type ScenarioCanonicalBindingIntentV1 = {
  binding_intent_version: 1;
  binding_slot: string;
  canonical_object_ref: CanonicalRef;
  scenario_owner_ref: CanonicalRef;
  expected_head: ScenarioCanonicalBindingExpectedHeadV1;
};

export type ScenarioCanonicalBindingPairRequestV1 = {
  pair_request_version: 1;
  identity_operation_id: string;
  workspace_ref: CanonicalRef;
  scenario_key: string;
  principal_provenance_hash: string;
  continuation_context_hash: string;
  pair_relation_evidence_hash: string;
  canonical_input_hash: string;
  bindings: [ScenarioCanonicalBindingIntentV1, ScenarioCanonicalBindingIntentV1];
};

export const scenarioCanonicalBindingEffects = ["created", "reused"] as const;
export type ScenarioCanonicalBindingEffect = (typeof scenarioCanonicalBindingEffects)[number];

export type ScenarioCanonicalBindingResultItemV1 = {
  binding_result_version: 1;
  binding_slot: string;
  canonical_object_ref: CanonicalRef;
  scenario_owner_ref: CanonicalRef;
  binding_ref: CanonicalRef;
  binding_version: number;
  effect: ScenarioCanonicalBindingEffect;
};

export const scenarioCanonicalBindingPairDispositions = ["committed", "exact_replay"] as const;
export type ScenarioCanonicalBindingPairDisposition =
  (typeof scenarioCanonicalBindingPairDispositions)[number];

export type ScenarioCanonicalBindingPairResultV1 = {
  pair_result_version: 1;
  identity_operation_id: string;
  canonical_input_hash: string;
  disposition: ScenarioCanonicalBindingPairDisposition;
  bindings: [ScenarioCanonicalBindingResultItemV1, ScenarioCanonicalBindingResultItemV1];
  pair_commit_evidence_hash: string;
};
