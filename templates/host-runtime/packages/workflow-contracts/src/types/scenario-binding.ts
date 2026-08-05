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
