import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import {
  workflowBatchExecutionControlAuthorityEnvelopeDomainPrefixV1,
  workflowBatchExecutionControlBoundsV1 as contractWorkflowBatchExecutionControlBoundsV1,
  workflowBatchExecutionControlReadObservationDomainPrefixV1,
  workflowBatchExecutionControlRequestDomainPrefixV1,
} from "@host/workflow-contracts";

export type WorkflowBatchExecutionControlDocumentKindV1 =
  | "open_input"
  | "mutation_command"
  | "read_query"
  | "authority_envelope"
  | "authority_receipt"
  | "read_observation"
  | "resolver_input"
  | "resolved_envelope";

export type WorkflowBatchExecutionControlDecodeFindingV1 = {
  code:
    | "invalid_json"
    | "duplicate_key"
    | "document_too_large"
    | "maximum_depth_exceeded"
    | "maximum_nodes_exceeded"
    | "unknown_key"
    | "missing_key"
    | "invalid_type"
    | "invalid_discriminator"
    | "invalid_scalar"
    | "limit_exceeded"
    | "invalid_hash_projection";
  path: string;
  message: string;
};

export type WorkflowBatchExecutionControlDecodeResultV1 =
  | { ok: true; value: unknown }
  | { ok: false; findings: WorkflowBatchExecutionControlDecodeFindingV1[] };

export const workflowBatchExecutionControlBoundsV1 =
  contractWorkflowBatchExecutionControlBoundsV1;

const protocolIdOrRefPattern = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,2047}$/;
const reasonCodePattern = /^[a-z][a-z0-9._-]{0,255}$/;
const opaqueCursorPattern = /^[A-Za-z0-9_-]{16,2048}$/;
const lowercaseSha256Pattern = /^[a-f0-9]{64}$/;
const canonicalDecimalPattern = /^(?:0|[1-9][0-9]*)$/;
const ownerTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const asciiPattern = /^[\x00-\x7f]*$/;
const maximumSignedInt64 = 9_223_372_036_854_775_807n;

class DecodeFailure extends Error {
  readonly finding: WorkflowBatchExecutionControlDecodeFindingV1;

  constructor(finding: WorkflowBatchExecutionControlDecodeFindingV1) {
    super(finding.message);
    this.finding = finding;
  }
}

function fail(
  code: WorkflowBatchExecutionControlDecodeFindingV1["code"],
  path: string,
  message: string,
): never {
  throw new DecodeFailure({ code, path, message });
}

function appendObjectPath(path: string, key: string): string {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(key) ? `${path}.${key}` : `${path}[${JSON.stringify(key)}]`;
}

class DuplicateAwareJsonParser {
  private offset = 0;
  private nodeCount = 0;

  constructor(private readonly source: string) {}

  parse(): unknown {
    this.skipWhitespace();
    const value = this.parseValue("$", 1);
    this.skipWhitespace();
    if (this.offset !== this.source.length) {
      fail("invalid_json", "$", `Unexpected token at byte offset ${this.offset}.`);
    }
    return value;
  }

  private parseValue(path: string, depth: number): unknown {
    if (depth > workflowBatchExecutionControlBoundsV1.max_json_depth) {
      fail(
        "maximum_depth_exceeded",
        path,
        `JSON depth exceeds ${workflowBatchExecutionControlBoundsV1.max_json_depth}.`,
      );
    }

    this.nodeCount += 1;
    if (this.nodeCount > workflowBatchExecutionControlBoundsV1.max_json_nodes) {
      fail(
        "maximum_nodes_exceeded",
        path,
        `JSON node count exceeds ${workflowBatchExecutionControlBoundsV1.max_json_nodes}.`,
      );
    }

    const token = this.source[this.offset];
    if (token === "{") return this.parseObject(path, depth);
    if (token === "[") return this.parseArray(path, depth);
    if (token === '"') return this.parseString(path);
    if (token === "t") return this.parseKeyword("true", true, path);
    if (token === "f") return this.parseKeyword("false", false, path);
    if (token === "n") return this.parseKeyword("null", null, path);
    if (token === "-" || (token !== undefined && token >= "0" && token <= "9")) {
      return this.parseNumber(path);
    }

    fail("invalid_json", path, `Expected a JSON value at byte offset ${this.offset}.`);
  }

  private parseObject(path: string, depth: number): Record<string, unknown> {
    this.offset += 1;
    this.skipWhitespace();

    const value: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    const keys = new Set<string>();
    if (this.source[this.offset] === "}") {
      this.offset += 1;
      return value;
    }

    while (true) {
      if (this.source[this.offset] !== '"') {
        fail("invalid_json", path, `Expected an object key at byte offset ${this.offset}.`);
      }
      const key = this.parseString(path);
      const keyPath = appendObjectPath(path, key);
      if (keys.has(key)) {
        fail("duplicate_key", keyPath, `Duplicate object key: ${key}.`);
      }
      keys.add(key);

      this.skipWhitespace();
      if (this.source[this.offset] !== ":") {
        fail("invalid_json", keyPath, `Expected ':' at byte offset ${this.offset}.`);
      }
      this.offset += 1;
      this.skipWhitespace();
      value[key] = this.parseValue(keyPath, depth + 1);
      this.skipWhitespace();

      const separator = this.source[this.offset];
      if (separator === "}") {
        this.offset += 1;
        return value;
      }
      if (separator !== ",") {
        fail("invalid_json", path, `Expected ',' or '}' at byte offset ${this.offset}.`);
      }
      this.offset += 1;
      this.skipWhitespace();
    }
  }

  private parseArray(path: string, depth: number): unknown[] {
    this.offset += 1;
    this.skipWhitespace();

    const value: unknown[] = [];
    if (this.source[this.offset] === "]") {
      this.offset += 1;
      return value;
    }

    while (true) {
      const itemPath = `${path}[${value.length}]`;
      value.push(this.parseValue(itemPath, depth + 1));
      this.skipWhitespace();

      const separator = this.source[this.offset];
      if (separator === "]") {
        this.offset += 1;
        return value;
      }
      if (separator !== ",") {
        fail("invalid_json", path, `Expected ',' or ']' at byte offset ${this.offset}.`);
      }
      this.offset += 1;
      this.skipWhitespace();
    }
  }

  private parseString(path: string): string {
    const start = this.offset;
    this.offset += 1;

    let escaped = false;
    while (this.offset < this.source.length) {
      const code = this.source.charCodeAt(this.offset);
      const character = this.source[this.offset];
      if (!escaped && character === '"') {
        this.offset += 1;
        const raw = this.source.slice(start, this.offset);
        let value: string;
        try {
          value = JSON.parse(raw) as string;
        } catch {
          fail("invalid_json", path, `Invalid JSON string at byte offset ${start}.`);
        }
        this.validateProtocolString(value, path);
        return value;
      }
      if (!escaped && code < 0x20) {
        fail("invalid_json", path, `Unescaped control character at byte offset ${this.offset}.`);
      }
      if (!escaped && character === "\\") {
        escaped = true;
      } else {
        escaped = false;
      }
      this.offset += 1;
    }

    fail("invalid_json", path, `Unterminated JSON string at byte offset ${start}.`);
  }

  private validateProtocolString(value: string, path: string): void {
    if (!asciiPattern.test(value)) {
      fail("invalid_scalar", path, "Protocol strings must contain ASCII characters only.");
    }
    const maximumBytes =
      path === "$.canonical_envelope_utf8"
        ? workflowBatchExecutionControlBoundsV1.max_canonical_envelope_bytes
        : workflowBatchExecutionControlBoundsV1.max_protocol_string_bytes;
    if (Buffer.byteLength(value, "utf8") > maximumBytes) {
      fail(
        "limit_exceeded",
        path,
        `Protocol string exceeds ${maximumBytes} UTF-8 bytes.`,
      );
    }
  }

  private parseNumber(path: string): number {
    const remaining = this.source.slice(this.offset);
    const match = /^(?:0|-[1-9][0-9]*|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(remaining);
    if (!match) {
      fail("invalid_json", path, `Invalid JSON number at byte offset ${this.offset}.`);
    }
    const raw = match[0];
    this.offset += raw.length;
    if (raw.includes(".") || raw.includes("e") || raw.includes("E")) {
      fail("invalid_scalar", path, "Floating-point values are not permitted in canonical protocol input.");
    }
    const value = Number(raw);
    if (!Number.isSafeInteger(value)) {
      fail("invalid_scalar", path, "Protocol numbers must be JSON safe integers.");
    }
    return value;
  }

  private parseKeyword<T extends boolean | null>(keyword: string, value: T, path: string): T {
    if (this.source.slice(this.offset, this.offset + keyword.length) !== keyword) {
      fail("invalid_json", path, `Invalid token at byte offset ${this.offset}.`);
    }
    this.offset += keyword.length;
    return value;
  }

  private skipWhitespace(): void {
    while (
      this.source[this.offset] === " " ||
      this.source[this.offset] === "\n" ||
      this.source[this.offset] === "\r" ||
      this.source[this.offset] === "\t"
    ) {
      this.offset += 1;
    }
  }
}

type JsonRecord = Record<string, unknown>;

type ValueValidator = (value: unknown, path: string) => void;
type ObjectShape = Record<string, ValueValidator>;

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireRecord(value: unknown, path: string): JsonRecord {
  if (!isRecord(value)) {
    fail("invalid_type", path, "Expected a JSON object.");
  }
  return value;
}

function validateExactObject(value: unknown, path: string, shape: ObjectShape): JsonRecord {
  const record = requireRecord(value, path);
  for (const key of Object.keys(record)) {
    if (!Object.hasOwn(shape, key)) {
      fail("unknown_key", appendObjectPath(path, key), `Unknown key: ${key}.`);
    }
  }
  for (const [key, validator] of Object.entries(shape)) {
    const childPath = appendObjectPath(path, key);
    if (!Object.hasOwn(record, key)) {
      fail("missing_key", childPath, `Missing required key: ${key}.`);
    }
    validator(record[key], childPath);
  }
  return record;
}

function readDiscriminator(value: unknown, path: string, key: string): string {
  const record = requireRecord(value, path);
  const discriminatorPath = appendObjectPath(path, key);
  if (!Object.hasOwn(record, key)) {
    fail("missing_key", discriminatorPath, `Missing required discriminator: ${key}.`);
  }
  const discriminator = record[key];
  if (typeof discriminator !== "string") {
    fail("invalid_discriminator", discriminatorPath, `Discriminator ${key} must be a string.`);
  }
  return discriminator;
}

function validateHash(value: unknown, path: string): void {
  if (typeof value !== "string" || !lowercaseSha256Pattern.test(value)) {
    fail("invalid_scalar", path, "Expected a lowercase 64-character SHA-256 hexadecimal hash.");
  }
}

function validateCanonicalDecimal(value: unknown, path: string): void {
  if (typeof value !== "string" || !canonicalDecimalPattern.test(value)) {
    fail("invalid_scalar", path, "Expected a canonical non-negative decimal string.");
  }
  if (BigInt(value) > maximumSignedInt64) {
    fail("invalid_scalar", path, "Canonical decimal exceeds signed 64-bit maximum.");
  }
}

function validatePositiveCanonicalDecimal(value: unknown, path: string): void {
  validateCanonicalDecimal(value, path);
  if (value === "0") {
    fail("invalid_scalar", path, "Expected a positive canonical decimal string.");
  }
}

function validateOwnerTimestamp(value: unknown, path: string): void {
  const parsed = typeof value === "string" ? Date.parse(value) : Number.NaN;
  if (
    typeof value !== "string" ||
    !ownerTimestampPattern.test(value) ||
    Number.isNaN(parsed) ||
    new Date(parsed).toISOString() !== value
  ) {
    fail("invalid_scalar", path, "Expected a valid UTC RFC 3339 timestamp with millisecond precision.");
  }
}

function validateProtocolIdOrRef(value: unknown, path: string): void {
  if (typeof value !== "string" || !protocolIdOrRefPattern.test(value)) {
    fail("invalid_scalar", path, "Expected an ASCII protocol ID/ref in the exported grammar.");
  }
}

function validateLiteral(expected: string | number | boolean | null): ValueValidator {
  return (value, path) => {
    if (value !== expected) {
      const code = typeof expected === "string" ? "invalid_discriminator" : "invalid_scalar";
      fail(code, path, `Expected literal ${JSON.stringify(expected)}.`);
    }
  };
}

function validateOneOf(values: readonly string[]): ValueValidator {
  const allowed = new Set(values);
  return (value, path) => {
    if (typeof value !== "string" || !allowed.has(value)) {
      fail("invalid_discriminator", path, `Expected one of: ${values.join(", ")}.`);
    }
  };
}

function validateSafeInteger(input: { minimum?: number; maximum?: number } = {}): ValueValidator {
  return (value, path) => {
    if (!Number.isSafeInteger(value)) {
      fail("invalid_scalar", path, "Expected a JSON safe integer.");
    }
    const integer = value as number;
    if (input.minimum !== undefined && integer < input.minimum) {
      fail("invalid_scalar", path, `Expected an integer greater than or equal to ${input.minimum}.`);
    }
    if (input.maximum !== undefined && integer > input.maximum) {
      fail("limit_exceeded", path, `Expected an integer no greater than ${input.maximum}.`);
    }
  };
}

function validateNullable(validator: ValueValidator): ValueValidator {
  return (value, path) => {
    if (value !== null) validator(value, path);
  };
}

function validateArray(
  itemValidator: ValueValidator,
  maximum: number,
  options: { minimum?: number; canonicalKey?: (item: unknown, path: string) => string } = {},
): ValueValidator {
  return (value, path) => {
    if (!Array.isArray(value)) {
      fail("invalid_type", path, "Expected a JSON array.");
    }
    if (value.length < (options.minimum ?? 0)) {
      fail("invalid_scalar", path, `Expected at least ${options.minimum ?? 0} array items.`);
    }
    if (value.length > maximum) {
      fail("limit_exceeded", path, `Array item count exceeds ${maximum}.`);
    }
    let previousKey: string | undefined;
    value.forEach((item, index) => {
      const itemPath = `${path}[${index}]`;
      itemValidator(item, itemPath);
      if (options.canonicalKey) {
        const currentKey = options.canonicalKey(item, itemPath);
        if (previousKey !== undefined && currentKey <= previousKey) {
          fail("invalid_scalar", itemPath, "Array keys must be unique and in canonical ascending order.");
        }
        previousKey = currentKey;
      }
    });
  };
}

const validateSchemaVersion = validateLiteral(1);
const validateNonNegativeInteger = validateSafeInteger({ minimum: 0 });
const validatePositiveInteger = validateSafeInteger({ minimum: 1 });
const validatePageLimit = validateSafeInteger({
  minimum: 1,
  maximum: workflowBatchExecutionControlBoundsV1.max_page_size,
});
const validateTtl = validateSafeInteger({
  minimum: workflowBatchExecutionControlBoundsV1.min_lease_ttl_seconds,
  maximum: workflowBatchExecutionControlBoundsV1.max_lease_ttl_seconds,
});

function validatePins(value: unknown, path: string): void {
  validateExactObject(value, path, {
    capability_family: validateLiteral("workflow_batch_execution_control_v1"),
    capability_version: validateLiteral(1),
    contract_revision: validateProtocolIdOrRef,
    contract_source_hash: validateHash,
    canonicalization_profile: validateLiteral("rfc8785_jcs_sha256_v1"),
    vector_release_hash: validateHash,
    owner_namespace: validateProtocolIdOrRef,
    receipt_issuer: validateProtocolIdOrRef,
    receipt_audience: validateProtocolIdOrRef,
    receipt_authority_id: validateProtocolIdOrRef,
    receipt_authority_version: validateCanonicalDecimal,
    owner_deployment_id: validateProtocolIdOrRef,
    owner_deployment_digest: validateHash,
    ledger_schema_revision: validateProtocolIdOrRef,
    trust_mode: validateLiteral("opaque_owner_readback_v1"),
  });
}

function validateScope(value: unknown, path: string): void {
  validateExactObject(value, path, {
    kind: validateOneOf(["platform", "organization", "workspace"]),
    scope_id: validateProtocolIdOrRef,
  });
}

function validatePolicyDecision(
  value: unknown,
  path: string,
  expectedKind: "forward_window" | "recovery_policy" | "readback",
): void {
  const shape: ObjectShape = {
    kind: validateLiteral(expectedKind),
    decision_ref: validateProtocolIdOrRef,
    decision_hash: validateHash,
    decision_issuer: validateProtocolIdOrRef,
    decision_audience: validateProtocolIdOrRef,
    not_before: validateOwnerTimestamp,
    expires_at: validateOwnerTimestamp,
  };
  if (expectedKind === "recovery_policy") {
    shape.expired_forward_decision_ref = validateProtocolIdOrRef;
  }
  const record = validateExactObject(value, path, shape);
  if ((record.not_before as string) >= (record.expires_at as string)) {
    fail("invalid_scalar", appendObjectPath(path, "expires_at"), "Policy expiry must be after not-before time.");
  }
}

function validateRequestMeta(value: unknown, path: string): void {
  validateExactObject(value, path, {
    command_id: validateProtocolIdOrRef,
    idempotency_key: validateProtocolIdOrRef,
    correlation_id: validateProtocolIdOrRef,
    request_hash: validateHash,
  });
}

const readSingletonOperations = [
  "describe_capability",
  "read_batch_snapshot",
  "read_global_admission_snapshot",
] as const;
const readPageOperations = [
  "read_batch_history_page",
  "read_uniqueness_page",
  "read_execution_receipts_page",
  "read_execution_lifecycle",
] as const;
const readOperations = [...readSingletonOperations, ...readPageOperations, "read_request_outcome"] as const;

function validateQueryBinding(value: unknown, path: string): void {
  const operation = readDiscriminator(value, path, "operation");
  if (!(readOperations as readonly string[]).includes(operation)) {
    fail("invalid_discriminator", `${path}.operation`, `Unknown read query-binding operation: ${operation}.`);
  }
  const common: ObjectShape = {
    operation: validateLiteral(operation),
    query_id: validateProtocolIdOrRef,
    query_hash: validateHash,
    read_policy: (item, itemPath) => validatePolicyDecision(item, itemPath, "readback"),
  };
  validateExactObject(
    value,
    path,
    operation === "read_request_outcome"
      ? {
          ...common,
          client_generation_key: validateProtocolIdOrRef,
          command_id: validateProtocolIdOrRef,
          idempotency_key: validateProtocolIdOrRef,
          request_hash: validateHash,
        }
      : common,
  );
}

function validateResumeQueryBinding(value: unknown, path: string): void {
  validateExactObject(value, path, {
    operation: validateLiteral("read_batch_snapshot"),
    query_id: validateProtocolIdOrRef,
    query_hash: validateHash,
    read_policy: (item, itemPath) => validatePolicyDecision(item, itemPath, "readback"),
  });
}

function validateBatchHead(value: unknown, path: string): void {
  const record = validateExactObject(value, path, {
    owner_batch_id: validateProtocolIdOrRef,
    state: validateOneOf([
      "planned",
      "executions_reserved",
      "executions_sealed",
      "client_commit_confirmed",
      "dispatch_recorded",
      "awaiting_completion",
      "completed",
      "recovery_required_reserved_unsealed",
      "recovery_required_sealed_undispatched",
      "recovery_required_dispatched",
      "quarantined_cancelled",
      "reconciled_completed",
      "reconciled_unresolved",
    ]),
    snapshot_version: validateCanonicalDecimal,
    ledger_sequence: validateCanonicalDecimal,
    last_event_hash: validateNullable(validateHash),
  });
  if (BigInt(record.snapshot_version as string) < 1n) {
    fail("invalid_scalar", `${path}.snapshot_version`, "An existing batch head requires snapshot version at least 1.");
  }
  if (BigInt(record.ledger_sequence as string) < 1n) {
    fail("invalid_scalar", `${path}.ledger_sequence`, "An existing batch head requires ledger sequence at least 1.");
  }
  if (record.last_event_hash === null) {
    fail("invalid_scalar", `${path}.last_event_hash`, "An existing batch head requires a non-null last-event hash.");
  }
}

function validateGlobalHead(value: unknown, path: string): void {
  const record = validateExactObject(value, path, {
    ledger_sequence: validateCanonicalDecimal,
    last_event_hash: validateNullable(validateHash),
    registry_version: validateCanonicalDecimal,
    admission_root: validateHash,
    uniqueness_root: validateHash,
    active_claim_count: validateNonNegativeInteger,
    active_reserved_execution_count: validateNonNegativeInteger,
    lifetime_logical_unit_count: validateNonNegativeInteger,
    lifetime_task_id_count: validateNonNegativeInteger,
    lifetime_execution_id_count: validateNonNegativeInteger,
  });
  const isGenesis = record.ledger_sequence === "0";
  if ((record.last_event_hash === null) !== isGenesis) {
    fail(
      "invalid_scalar",
      `${path}.last_event_hash`,
      "Global last-event hash must be null exactly at ledger sequence 0.",
    );
  }
}

function validateCapacityDelta(value: unknown, path: string): void {
  validateExactObject(value, path, {
    active_claim_count: validateSafeInteger({ minimum: -1, maximum: 1 }),
    active_reserved_execution_count: validateSafeInteger({
      minimum: -workflowBatchExecutionControlBoundsV1.max_units_per_batch,
      maximum: workflowBatchExecutionControlBoundsV1.max_units_per_batch,
    }),
    lifetime_logical_unit_count: validateSafeInteger({
      minimum: 0,
      maximum: workflowBatchExecutionControlBoundsV1.max_units_per_batch,
    }),
    lifetime_task_id_count: validateSafeInteger({
      minimum: 0,
      maximum: workflowBatchExecutionControlBoundsV1.max_units_per_batch,
    }),
    lifetime_execution_id_count: validateSafeInteger({
      minimum: 0,
      maximum: workflowBatchExecutionControlBoundsV1.max_units_per_batch,
    }),
  });
}

const recoveryOperations = [
  "renew_batch_claim",
  "release_batch_claim",
  "confirm_client_commit",
  "dispatch_batch",
  "quarantine_reservation",
  "reconcile_batch",
] as const;

function canonicalStringItem(item: unknown, path: string): string {
  if (typeof item !== "string") fail("invalid_type", path, "Expected a string array item.");
  return item;
}

const validateRecoveryOperationArray = validateArray(
  validateOneOf(recoveryOperations),
  workflowBatchExecutionControlBoundsV1.max_recovery_operations,
  { minimum: 1, canonicalKey: canonicalStringItem },
);

const validateNonEmptyRecoveryOperationArray = validateArray(
  validateOneOf(recoveryOperations),
  workflowBatchExecutionControlBoundsV1.max_recovery_operations,
  { minimum: 1, canonicalKey: canonicalStringItem },
);

function validateNoClaim(value: unknown, path: string): void {
  validateExactObject(value, path, { kind: validateLiteral("none") });
}

const ordinaryClaimShape: ObjectShape = {
  kind: validateLiteral("ordinary"),
  claim_id: validateProtocolIdOrRef,
  lease_id: validateProtocolIdOrRef,
  fence: validatePositiveCanonicalDecimal,
  owner_issued_at: validateOwnerTimestamp,
  lease_expires_at: validateOwnerTimestamp,
};

function validateClaimLease(record: JsonRecord, path: string): void {
  const issuedAt = Date.parse(record.owner_issued_at as string);
  const expiresAt = Date.parse(record.lease_expires_at as string);
  const ttlMilliseconds = expiresAt - issuedAt;
  if (ttlMilliseconds <= 0) {
    fail("invalid_scalar", `${path}.lease_expires_at`, "Claim lease expiry must be after owner issuance.");
  }
  if (
    ttlMilliseconds < workflowBatchExecutionControlBoundsV1.min_lease_ttl_seconds * 1_000 ||
    ttlMilliseconds > workflowBatchExecutionControlBoundsV1.max_lease_ttl_seconds * 1_000
  ) {
    fail(
      "invalid_scalar",
      `${path}.lease_expires_at`,
      `Claim lease TTL must be between ${workflowBatchExecutionControlBoundsV1.min_lease_ttl_seconds} and ${workflowBatchExecutionControlBoundsV1.max_lease_ttl_seconds} seconds.`,
    );
  }
}

function validateOrdinaryClaim(value: unknown, path: string): void {
  const record = validateExactObject(value, path, ordinaryClaimShape);
  validateClaimLease(record, path);
}

function validateReconciliationClaim(value: unknown, path: string): void {
  const record = validateExactObject(value, path, {
    ...ordinaryClaimShape,
    kind: validateLiteral("reconciliation_only"),
    original_identity_collection_hash: validateHash,
    recovery_policy: (item, itemPath) => validatePolicyDecision(item, itemPath, "recovery_policy"),
    allowed_operations: validateNonEmptyRecoveryOperationArray,
    allowed_operations_hash: validateHash,
  });
  validateClaimLease(record, path);
  const recoveryPolicy = requireRecord(record.recovery_policy, `${path}.recovery_policy`);
  if ((recoveryPolicy.not_before as string) > (record.owner_issued_at as string)) {
    fail(
      "invalid_scalar",
      `${path}.owner_issued_at`,
      "Reconciliation claim issuance cannot precede its recovery-policy window.",
    );
  }
  if ((record.lease_expires_at as string) > (recoveryPolicy.expires_at as string)) {
    fail(
      "invalid_scalar",
      `${path}.lease_expires_at`,
      "Reconciliation claim lease cannot outlive its recovery-policy window.",
    );
  }
}

function validateMutationClaim(value: unknown, path: string): void {
  const kind = readDiscriminator(value, path, "kind");
  if (kind === "ordinary") return validateOrdinaryClaim(value, path);
  if (kind === "reconciliation_only") return validateReconciliationClaim(value, path);
  fail("invalid_discriminator", appendObjectPath(path, "kind"), `Invalid current claim kind: ${kind}.`);
}

function validateRecoveryClaim(value: unknown, path: string): void {
  const kind = readDiscriminator(value, path, "kind");
  if (kind === "none") return validateNoClaim(value, path);
  if (kind === "reconciliation_only") return validateReconciliationClaim(value, path);
  fail("invalid_discriminator", appendObjectPath(path, "kind"), `Invalid recovery claim kind: ${kind}.`);
}

function validatePlannedClaim(value: unknown, path: string): void {
  const kind = readDiscriminator(value, path, "kind");
  if (kind === "none") return validateNoClaim(value, path);
  if (kind === "ordinary") return validateOrdinaryClaim(value, path);
  fail("invalid_discriminator", appendObjectPath(path, "kind"), `Invalid planned claim kind: ${kind}.`);
}

function validateLogicalUnit(value: unknown, path: string): void {
  validateExactObject(value, path, {
    logical_unit_hash: validateHash,
    execution_binding_hash: validateHash,
    workload_class_hash: validateHash,
  });
}

function readCanonicalHashKey(key: string): (item: unknown, path: string) => string {
  return (item, path) => {
    const record = requireRecord(item, path);
    const value = record[key];
    if (typeof value !== "string") fail("invalid_type", appendObjectPath(path, key), `Expected ${key}.`);
    return value;
  };
}

const validateLogicalUnits = validateArray(
  validateLogicalUnit,
  workflowBatchExecutionControlBoundsV1.max_units_per_batch,
  { minimum: 1, canonicalKey: readCanonicalHashKey("logical_unit_hash") },
);

function validateSupersession(value: unknown, path: string): void {
  validateExactObject(value, path, {
    prior_owner_batch_id: validateProtocolIdOrRef,
    prior_tombstone_receipt_ref: validateProtocolIdOrRef,
    prior_tombstone_hash: validateHash,
  });
}

function validateOpenBinding(value: unknown, path: string): void {
  const record = validateExactObject(value, path, {
    client_generation_key: validateProtocolIdOrRef,
    logical_series_hash: validateHash,
    purpose_profile_hash: validateHash,
    logical_unit_collection_root: validateHash,
    logical_unit_count: validateSafeInteger({
      minimum: 1,
      maximum: workflowBatchExecutionControlBoundsV1.max_units_per_batch,
    }),
    binding_hash: validateHash,
    generation: validateNonNegativeInteger,
    supersession: () => undefined,
    logical_units: validateLogicalUnits,
  });
  const generation = record.generation as number;
  if (generation === 0) {
    validateLiteral(null)(record.supersession, appendObjectPath(path, "supersession"));
  } else {
    validateSupersession(record.supersession, appendObjectPath(path, "supersession"));
  }
  const logicalUnits = record.logical_units as unknown[];
  if (record.logical_unit_count !== logicalUnits.length) {
    fail("invalid_scalar", appendObjectPath(path, "logical_unit_count"), "Logical-unit count does not match the array length.");
  }
}

function validateExpectedAbsent(value: unknown, path: string): void {
  validateExactObject(value, path, {
    kind: validateLiteral("expected_absent"),
    expected_global_head: validateGlobalHead,
  });
}

function validateExpectedExisting(value: unknown, path: string): void {
  validateExactObject(value, path, {
    kind: validateLiteral("expected_existing"),
    expected_binding_hash: validateHash,
    expected_batch_head: validateBatchHead,
    expected_global_head: validateGlobalHead,
  });
}

function validateCreateOpenInput(value: unknown, path: string): void {
  const record = validateExactObject(value, path, {
    kind: validateLiteral("create_if_absent"),
    operation: validateLiteral("open_or_resume_batch"),
    schema_version: validateSchemaVersion,
    pins: validatePins,
    scope: validateScope,
    policy_decision: (item, itemPath) => validatePolicyDecision(item, itemPath, "forward_window"),
    request_meta: validateRequestMeta,
    binding: validateOpenBinding,
    precondition: validateExpectedAbsent,
  });
  void record;
}

function validateResumeOpenInput(value: unknown, path: string): void {
  validateExactObject(value, path, {
    kind: validateLiteral("resume_existing"),
    operation: validateLiteral("open_or_resume_batch"),
    schema_version: validateSchemaVersion,
    expected_pins: validatePins,
    scope: validateScope,
    client_generation_key: validateProtocolIdOrRef,
    query: validateResumeQueryBinding,
    precondition: validateExpectedExisting,
  });
}

function validateOpenInput(value: unknown, path: string): void {
  const kind = readDiscriminator(value, path, "kind");
  if (kind === "create_if_absent") return validateCreateOpenInput(value, path);
  if (kind === "resume_existing") return validateResumeOpenInput(value, path);
  fail("invalid_discriminator", appendObjectPath(path, "kind"), `Unknown open input kind: ${kind}.`);
}

function validateMutationCommon(
  record: JsonRecord,
  path: string,
  policyKind: "forward_window" | "recovery_policy",
): void {
  validateSchemaVersion(record.schema_version, `${path}.schema_version`);
  validatePins(record.pins, `${path}.pins`);
  validateScope(record.scope, `${path}.scope`);
  validatePolicyDecision(record.policy_decision, `${path}.policy_decision`, policyKind);
  validateRequestMeta(record.request_meta, `${path}.request_meta`);
  validateProtocolIdOrRef(record.owner_batch_id, `${path}.owner_batch_id`);
  validateHash(record.purpose_profile_hash, `${path}.purpose_profile_hash`);
  validateExpectedExisting(record.precondition, `${path}.precondition`);
  const precondition = requireRecord(record.precondition, `${path}.precondition`);
  const batchHead = requireRecord(precondition.expected_batch_head, `${path}.precondition.expected_batch_head`);
  if (batchHead.owner_batch_id !== record.owner_batch_id) {
    fail(
      "invalid_scalar",
      `${path}.precondition.expected_batch_head.owner_batch_id`,
      "Mutation owner batch ID must match its expected-existing precondition.",
    );
  }
}

const mutationCommonShape: ObjectShape = {
  schema_version: () => undefined,
  pins: () => undefined,
  scope: () => undefined,
  policy_decision: () => undefined,
  request_meta: () => undefined,
  owner_batch_id: () => undefined,
  purpose_profile_hash: () => undefined,
  precondition: () => undefined,
  operation: () => undefined,
};

function validateClaimPayload(value: unknown, path: string): void {
  const claimType = readDiscriminator(value, path, "claim_type");
  if (claimType === "ordinary") {
    validateExactObject(value, path, {
      claim_type: validateLiteral("ordinary"),
      requested_ttl_seconds: validateTtl,
    });
    return;
  }
  if (claimType === "reconciliation_only") {
    validateExactObject(value, path, {
      claim_type: validateLiteral("reconciliation_only"),
      requested_ttl_seconds: validateTtl,
      original_identity_collection_hash: validateHash,
      requested_operations: validateRecoveryOperationArray,
    });
    return;
  }
  fail("invalid_discriminator", appendObjectPath(path, "claim_type"), `Unknown claim type: ${claimType}.`);
}

function validateReconcilePayload(value: unknown, path: string): void {
  const outcome = readDiscriminator(value, path, "outcome");
  if (outcome === "completed") {
    validateExactObject(value, path, {
      outcome: validateLiteral("completed"),
      expected_completion_collection_root: validateHash,
      expected_lifecycle_head: validateHash,
      reason_code: validateReasonCode,
    });
    return;
  }
  if (outcome === "unresolved") {
    validateExactObject(value, path, {
      outcome: validateLiteral("unresolved"),
      expected_completion_collection_root: validateNullable(validateHash),
      expected_lifecycle_head: validateNullable(validateHash),
      reason_code: validateReasonCode,
    });
    return;
  }
  fail("invalid_discriminator", appendObjectPath(path, "outcome"), `Unknown reconciliation outcome: ${outcome}.`);
}

function validateMutationCommand(value: unknown, path: string): void {
  const operation = readDiscriminator(value, path, "operation");
  let claimKey: "expected_claim" | "current_claim";
  let claimValidator: ValueValidator;
  let payloadValidator: ValueValidator;
  let policyKind: "forward_window" | "recovery_policy";

  switch (operation) {
    case "claim_batch":
      claimKey = "expected_claim";
      claimValidator = validateNoClaim;
      payloadValidator = validateClaimPayload;
      policyKind = readDiscriminator(requireRecord(value, path).payload, `${path}.payload`, "claim_type") === "ordinary"
        ? "forward_window"
        : "recovery_policy";
      break;
    case "renew_batch_claim":
      claimKey = "current_claim";
      claimValidator = validateMutationClaim;
      payloadValidator = (payload, payloadPath) =>
        validateExactObject(payload, payloadPath, { requested_ttl_seconds: validateTtl });
      policyKind = readDiscriminator(requireRecord(value, path).current_claim, `${path}.current_claim`, "kind") === "ordinary"
        ? "forward_window"
        : "recovery_policy";
      break;
    case "release_batch_claim":
      claimKey = "current_claim";
      claimValidator = validateMutationClaim;
      payloadValidator = (payload, payloadPath) => validateExactObject(payload, payloadPath, {});
      policyKind = readDiscriminator(requireRecord(value, path).current_claim, `${path}.current_claim`, "kind") === "ordinary"
        ? "forward_window"
        : "recovery_policy";
      break;
    case "reserve_executions":
      claimKey = "current_claim";
      claimValidator = validateOrdinaryClaim;
      payloadValidator = (payload, payloadPath) =>
        validateExactObject(payload, payloadPath, {
          logical_unit_collection_root: validateHash,
          reservation_intent_hash: validateHash,
        });
      policyKind = "forward_window";
      break;
    case "seal_execution_manifest":
      claimKey = "current_claim";
      claimValidator = validateOrdinaryClaim;
      payloadValidator = (payload, payloadPath) =>
        validateExactObject(payload, payloadPath, {
          reservation_hash: validateHash,
          execution_manifest_hash: validateHash,
        });
      policyKind = "forward_window";
      break;
    case "confirm_client_commit":
      claimKey = "current_claim";
      claimValidator = validateMutationClaim;
      payloadValidator = (payload, payloadPath) =>
        validateExactObject(payload, payloadPath, {
          seal_hash: validateHash,
          execution_manifest_hash: validateHash,
          client_commit_ref: validateProtocolIdOrRef,
          client_commit_hash: validateHash,
        });
      policyKind = readDiscriminator(requireRecord(value, path).current_claim, `${path}.current_claim`, "kind") === "ordinary"
        ? "forward_window"
        : "recovery_policy";
      break;
    case "dispatch_batch":
      claimKey = "current_claim";
      claimValidator = validateMutationClaim;
      payloadValidator = (payload, payloadPath) =>
        validateExactObject(payload, payloadPath, {
          seal_hash: validateHash,
          client_commit_hash: validateHash,
          execution_manifest_hash: validateHash,
        });
      policyKind = readDiscriminator(requireRecord(value, path).current_claim, `${path}.current_claim`, "kind") === "ordinary"
        ? "forward_window"
        : "recovery_policy";
      break;
    case "quarantine_reservation":
      claimKey = "current_claim";
      claimValidator = validateReconciliationClaim;
      payloadValidator = (payload, payloadPath) =>
        validateExactObject(payload, payloadPath, {
          reservation_hash: validateHash,
          original_identity_collection_hash: validateHash,
          reason_code: validateReasonCode,
        });
      policyKind = "recovery_policy";
      break;
    case "reconcile_batch":
      claimKey = "current_claim";
      claimValidator = validateReconciliationClaim;
      payloadValidator = validateReconcilePayload;
      policyKind = "recovery_policy";
      break;
    default:
      fail("invalid_discriminator", appendObjectPath(path, "operation"), `Unknown mutation operation: ${operation}.`);
  }

  const record = validateExactObject(value, path, {
    ...mutationCommonShape,
    operation: validateLiteral(operation),
    [claimKey]: claimValidator,
    payload: payloadValidator,
  });
  validateMutationCommon(record, path, policyKind);
  if (claimKey === "current_claim") {
    const claim = requireRecord(record.current_claim, `${path}.current_claim`);
    if (claim.kind === "reconciliation_only") {
      const precondition = requireRecord(record.precondition, `${path}.precondition`);
      const expectedBatchHead = requireRecord(
        precondition.expected_batch_head,
        `${path}.precondition.expected_batch_head`,
      );
      const allowedForState = reconciliationClaimOperationsByRecoveryState[
        expectedBatchHead.state as string
      ];
      if (allowedForState === undefined) {
        fail(
          "invalid_scalar",
          `${path}.precondition.expected_batch_head.state`,
          "Reconciliation claims can be used only from a recovery-state precondition.",
        );
      }
      for (let index = 0; index < (claim.allowed_operations as unknown[]).length; index += 1) {
        const allowedOperation = (claim.allowed_operations as unknown[])[index] as string;
        if (!allowedForState.has(allowedOperation)) {
          fail(
            "invalid_scalar",
            `${path}.current_claim.allowed_operations[${index}]`,
            `Recovery precondition state ${String(expectedBatchHead.state)} does not permit claim operation ${allowedOperation}.`,
          );
        }
      }
      if (!(claim.allowed_operations as unknown[]).includes(operation)) {
        fail(
          "invalid_scalar",
          `${path}.operation`,
          "Recovery mutation operation is not present in the reconciliation claim allowlist.",
        );
      }
      requireEqual(
        record.policy_decision,
        claim.recovery_policy,
        `${path}.policy_decision`,
        "Recovery mutation policy decision must exactly equal the reconciliation claim recovery policy.",
      );
      if (operation === "quarantine_reservation") {
        const payload = requireRecord(record.payload, `${path}.payload`);
        requireEqual(
          payload.original_identity_collection_hash,
          claim.original_identity_collection_hash,
          `${path}.payload.original_identity_collection_hash`,
          "Quarantine payload must preserve the reconciliation claim identity collection.",
        );
      }
    }
  }
}

const readCommonShape: ObjectShape = {
  operation: () => undefined,
  schema_version: validateSchemaVersion,
  expected_pins: validatePins,
  scope: validateScope,
  query: validateQueryBinding,
  as_of_batch_head: validateNullable(validateBatchHead),
  as_of_global_head: validateGlobalHead,
};

function validateMatchingQueryOperation(value: unknown, path: string, operation: string): void {
  const record = requireRecord(value, path);
  const query = requireRecord(record.query, `${path}.query`);
  if (query.operation !== operation) {
    fail("invalid_scalar", `${path}.query.operation`, "Top-level and query-binding read operations must match.");
  }
}

function validateReadQuery(value: unknown, path: string): void {
  const operation = readDiscriminator(value, path, "operation");
  if (!(readOperations as readonly string[]).includes(operation)) {
    fail("invalid_discriminator", appendObjectPath(path, "operation"), `Unknown read operation: ${operation}.`);
  }
  if ((readPageOperations as readonly string[]).includes(operation)) {
    validateExactObject(value, path, {
      ...readCommonShape,
      operation: validateLiteral(operation),
      cursor: validateCursor,
      limit: validatePageLimit,
    });
    validateMatchingQueryOperation(value, path, operation);
    return;
  }
  if (operation === "read_request_outcome") {
    validateExactObject(value, path, {
      ...readCommonShape,
      operation: validateLiteral(operation),
    });
    validateMatchingQueryOperation(value, path, operation);
    return;
  }
  validateExactObject(value, path, { ...readCommonShape, operation: validateLiteral(operation) });
  validateMatchingQueryOperation(value, path, operation);
}

function validateAllocation(value: unknown, path: string): void {
  validateExactObject(value, path, {
    logical_unit_hash: validateHash,
    execution_binding_hash: validateHash,
    workload_class_hash: validateHash,
    owner_task_id: validateProtocolIdOrRef,
    owner_execution_id: validateProtocolIdOrRef,
  });
}

function validateReservation(value: unknown, path: string): void {
  const record = validateExactObject(value, path, {
    reservation_id: validateProtocolIdOrRef,
    logical_unit_collection_root: validateHash,
    identity_collection_hash: validateHash,
    allocations: validateArray(validateAllocation, workflowBatchExecutionControlBoundsV1.max_units_per_batch, {
      minimum: 1,
      canonicalKey: readCanonicalHashKey("logical_unit_hash"),
    }),
    allocation_count: validateSafeInteger({
      minimum: 1,
      maximum: workflowBatchExecutionControlBoundsV1.max_units_per_batch,
    }),
    reserved_at: validateOwnerTimestamp,
    reservation_hash: validateHash,
  });
  if (record.allocation_count !== (record.allocations as unknown[]).length) {
    fail("invalid_scalar", `${path}.allocation_count`, "Allocation count does not match the array length.");
  }
  const taskIds = new Set<string>();
  const executionIds = new Set<string>();
  for (let index = 0; index < (record.allocations as unknown[]).length; index += 1) {
    const allocationPath = `${path}.allocations[${index}]`;
    const allocation = requireRecord((record.allocations as unknown[])[index], allocationPath);
    const taskId = allocation.owner_task_id as string;
    const executionId = allocation.owner_execution_id as string;
    if (taskIds.has(taskId)) {
      fail("invalid_scalar", `${allocationPath}.owner_task_id`, "Reservation owner task IDs must be unique.");
    }
    if (executionIds.has(executionId)) {
      fail(
        "invalid_scalar",
        `${allocationPath}.owner_execution_id`,
        "Reservation owner execution IDs must be unique.",
      );
    }
    taskIds.add(taskId);
    executionIds.add(executionId);
  }
}

function validateSeal(value: unknown, path: string): void {
  validateExactObject(value, path, {
    seal_id: validateProtocolIdOrRef,
    reservation_hash: validateHash,
    execution_manifest_hash: validateHash,
    allocation_count: validateSafeInteger({
      minimum: 1,
      maximum: workflowBatchExecutionControlBoundsV1.max_units_per_batch,
    }),
    sealed_at: validateOwnerTimestamp,
    seal_hash: validateHash,
  });
}

function validateClientCommit(value: unknown, path: string): void {
  validateExactObject(value, path, {
    client_commit_ref: validateProtocolIdOrRef,
    client_commit_hash: validateHash,
    execution_manifest_hash: validateHash,
    confirmed_at: validateOwnerTimestamp,
  });
}

function validateDispatch(value: unknown, path: string): void {
  validateExactObject(value, path, {
    dispatch_id: validateProtocolIdOrRef,
    seal_hash: validateHash,
    client_commit_hash: validateHash,
    execution_manifest_hash: validateHash,
    dispatch_commit_hash: validateHash,
    outbox_intent_root: validateHash,
    recorded_before_effect: validateLiteral(true),
    recorded_at: validateOwnerTimestamp,
  });
}

function validateDispatchEffect(value: unknown, path: string): void {
  const kind = readDiscriminator(value, path, "kind");
  if (kind === "recorded") {
    validateExactObject(value, path, {
      kind: validateLiteral("recorded"),
      dispatch_commit_hash: validateHash,
    });
    return;
  }
  if (kind === "started") {
    validateExactObject(value, path, {
      kind: validateLiteral("started"),
      dispatch_commit_hash: validateHash,
      effect_started_at: validateOwnerTimestamp,
      effect_observation_hash: validateHash,
    });
    return;
  }
  fail("invalid_discriminator", appendObjectPath(path, "kind"), `Unknown dispatch effect status: ${kind}.`);
}

function validateCompletion(value: unknown, path: string): void {
  const kind = readDiscriminator(value, path, "kind");
  const common: ObjectShape = {
    kind: validateLiteral(kind),
    receipt_count: validateSafeInteger({
      minimum: 0,
      maximum: workflowBatchExecutionControlBoundsV1.max_units_per_batch,
    }),
    expected_count: validateSafeInteger({
      minimum: 1,
      maximum: workflowBatchExecutionControlBoundsV1.max_units_per_batch,
    }),
    collection_root: validateHash,
  };
  const record = validateExactObject(
    value,
    path,
    kind === "all_terminal" ? { ...common, lifecycle_head: validateHash } : common,
  );
  const receiptCount = record.receipt_count as number;
  const expectedCount = record.expected_count as number;
  if (kind === "none" && receiptCount !== 0) {
    fail("invalid_scalar", `${path}.receipt_count`, "Completion none requires zero receipts.");
  } else if (kind === "partial" && !(receiptCount > 0 && receiptCount < expectedCount)) {
    fail("invalid_scalar", `${path}.receipt_count`, "Partial completion requires 0 < receipt_count < expected_count.");
  } else if (kind === "all_terminal" && receiptCount !== expectedCount) {
    fail("invalid_scalar", `${path}.receipt_count`, "All-terminal completion requires equal receipt and expected counts.");
  } else if (kind !== "none" && kind !== "partial" && kind !== "all_terminal") {
    fail("invalid_discriminator", `${path}.kind`, `Unknown completion status: ${kind}.`);
  }
}

function validateClientCommitStatus(value: unknown, path: string): void {
  const kind = readDiscriminator(value, path, "kind");
  if (kind === "not_confirmed") {
    validateExactObject(value, path, { kind: validateLiteral("not_confirmed") });
  } else if (kind === "confirmed") {
    validateExactObject(value, path, {
      kind: validateLiteral("confirmed"),
      client_commit_ref: validateProtocolIdOrRef,
      client_commit_hash: validateHash,
      execution_manifest_hash: validateHash,
      confirmed_at: validateOwnerTimestamp,
    });
  } else {
    fail("invalid_discriminator", `${path}.kind`, `Unknown client commit status: ${kind}.`);
  }
}

function validateRecovery(
  value: unknown,
  path: string,
  allowedOrigins: readonly string[] = [
    "executions_reserved",
    "executions_sealed",
    "client_commit_confirmed",
    "dispatch_recorded",
    "awaiting_completion",
  ],
): void {
  validateExactObject(value, path, {
    recovery_id: validateProtocolIdOrRef,
    origin_state: validateOneOf(allowedOrigins),
    original_identity_collection_hash: validateHash,
    entered_at: validateOwnerTimestamp,
    recovery_hash: validateHash,
  });
}

function validateTombstone(value: unknown, path: string): void {
  validateExactObject(value, path, {
    tombstone_id: validateProtocolIdOrRef,
    reservation_hash: validateHash,
    original_identity_collection_hash: validateHash,
    reason_code: validateReasonCode,
    cancelled_at: validateOwnerTimestamp,
    tombstone_hash: validateHash,
  });
}

function validateReconciliation(value: unknown, path: string, expectedOutcome?: "completed" | "unresolved"): void {
  const record = validateExactObject(value, path, {
    reconciliation_id: validateProtocolIdOrRef,
    outcome: validateOneOf(["completed", "unresolved"]),
    original_identity_collection_hash: validateHash,
    completion_collection_root: validateNullable(validateHash),
    lifecycle_head: validateNullable(validateHash),
    reason_code: validateReasonCode,
    reconciled_at: validateOwnerTimestamp,
    reconciliation_hash: validateHash,
  });
  if (expectedOutcome !== undefined && record.outcome !== expectedOutcome) {
    fail("invalid_discriminator", `${path}.outcome`, `Expected reconciliation outcome ${expectedOutcome}.`);
  }
  if (record.outcome === "completed" && (record.completion_collection_root === null || record.lifecycle_head === null)) {
    fail("invalid_scalar", path, "Completed reconciliation requires completion and lifecycle roots.");
  }
}

function validateBatchBinding(value: unknown, path: string): void {
  const record = validateExactObject(value, path, {
    owner_batch_id: validateProtocolIdOrRef,
    client_generation_key: validateProtocolIdOrRef,
    logical_series_hash: validateHash,
    purpose_profile_hash: validateHash,
    logical_unit_collection_root: validateHash,
    logical_unit_count: validateSafeInteger({
      minimum: 1,
      maximum: workflowBatchExecutionControlBoundsV1.max_units_per_batch,
    }),
    binding_hash: validateHash,
    generation: validateNonNegativeInteger,
    supersession: () => undefined,
  });
  if (record.generation === 0) {
    validateLiteral(null)(record.supersession, `${path}.supersession`);
  } else {
    validateSupersession(record.supersession, `${path}.supersession`);
    const supersession = requireRecord(record.supersession, `${path}.supersession`);
    if (supersession.prior_owner_batch_id === record.owner_batch_id) {
      fail(
        "invalid_scalar",
        `${path}.supersession.prior_owner_batch_id`,
        "A later generation must use a new owner batch ID.",
      );
    }
  }
}

function requireTimestampAtOrAfter(later: unknown, earlier: unknown, path: string, message: string): void {
  if (typeof later !== "string" || typeof earlier !== "string" || later < earlier) {
    fail("invalid_scalar", path, message);
  }
}

function requireSnapshotFactsNoLaterThan(
  snapshot: JsonRecord,
  upperBound: unknown,
  path: string,
): void {
  const facts: Array<[string, string]> = [];
  const claim = requireRecord(snapshot.claim, `${path}.claim`);
  if (claim.kind !== "none") facts.push(["claim", "owner_issued_at"]);
  for (const [containerKey, timestampKey] of [
    ["reservation", "reserved_at"],
    ["seal", "sealed_at"],
    ["client_commit", "confirmed_at"],
    ["dispatch", "recorded_at"],
    ["recovery", "entered_at"],
    ["tombstone", "cancelled_at"],
    ["reconciliation", "reconciled_at"],
  ] as const) {
    if (Object.hasOwn(snapshot, containerKey)) facts.push([containerKey, timestampKey]);
  }
  if (Object.hasOwn(snapshot, "client_commit_status")) {
    const status = requireRecord(snapshot.client_commit_status, `${path}.client_commit_status`);
    if (status.kind === "confirmed") facts.push(["client_commit_status", "confirmed_at"]);
  }
  if (Object.hasOwn(snapshot, "dispatch_effect_status")) {
    const status = requireRecord(snapshot.dispatch_effect_status, `${path}.dispatch_effect_status`);
    if (status.kind === "started") facts.push(["dispatch_effect_status", "effect_started_at"]);
  }
  for (const [containerKey, timestampKey] of facts) {
    const container = requireRecord(snapshot[containerKey], `${path}.${containerKey}`);
    requireTimestampAtOrAfter(
      upperBound,
      container[timestampKey],
      `${path}.${containerKey}.${timestampKey}`,
      "Result snapshot owner fact cannot be later than its enclosing observation or commit time.",
    );
  }
}

const snapshotBaseShape: ObjectShape = {
  schema_version: validateSchemaVersion,
  pins: validatePins,
  scope: validateScope,
  state: () => undefined,
  binding: validateBatchBinding,
  logical_units: validateLogicalUnits,
  batch_head: validateBatchHead,
  global_head: validateGlobalHead,
  snapshot_hash: validateHash,
};

const reconciliationClaimOperationsByRecoveryState: Readonly<Record<string, ReadonlySet<string>>> = {
  recovery_required_reserved_unsealed: new Set([
    "quarantine_reservation",
    "release_batch_claim",
    "renew_batch_claim",
  ]),
  recovery_required_sealed_undispatched: new Set([
    "confirm_client_commit",
    "dispatch_batch",
    "reconcile_batch",
    "release_batch_claim",
    "renew_batch_claim",
  ]),
  recovery_required_dispatched: new Set([
    "reconcile_batch",
    "release_batch_claim",
    "renew_batch_claim",
  ]),
};

function validateSnapshot(value: unknown, path: string): void {
  const state = readDiscriminator(value, path, "state");
  let stateShape: ObjectShape;
  switch (state) {
    case "planned":
      stateShape = { claim: validatePlannedClaim };
      break;
    case "executions_reserved":
      stateShape = { claim: validateOrdinaryClaim, reservation: validateReservation };
      break;
    case "executions_sealed":
      stateShape = { claim: validateOrdinaryClaim, reservation: validateReservation, seal: validateSeal };
      break;
    case "client_commit_confirmed":
      stateShape = {
        claim: validateOrdinaryClaim,
        reservation: validateReservation,
        seal: validateSeal,
        client_commit: validateClientCommit,
      };
      break;
    case "dispatch_recorded":
    case "awaiting_completion":
    case "completed":
      stateShape = {
        claim: state === "completed" ? validateNoClaim : validateOrdinaryClaim,
        reservation: validateReservation,
        seal: validateSeal,
        client_commit: validateClientCommit,
        dispatch: validateDispatch,
        dispatch_effect_status: validateDispatchEffect,
        completion_status: validateCompletion,
      };
      break;
    case "recovery_required_reserved_unsealed":
      stateShape = {
        claim: validateRecoveryClaim,
        reservation: validateReservation,
        recovery: (item, itemPath) => validateRecovery(item, itemPath, ["executions_reserved"]),
      };
      break;
    case "recovery_required_sealed_undispatched":
      stateShape = {
        claim: validateRecoveryClaim,
        reservation: validateReservation,
        seal: validateSeal,
        client_commit_status: validateClientCommitStatus,
        recovery: (item, itemPath) =>
          validateRecovery(item, itemPath, ["executions_sealed", "client_commit_confirmed"]),
      };
      break;
    case "recovery_required_dispatched":
      stateShape = {
        claim: validateRecoveryClaim,
        reservation: validateReservation,
        seal: validateSeal,
        client_commit: validateClientCommit,
        dispatch: validateDispatch,
        dispatch_effect_status: validateDispatchEffect,
        completion_status: validateCompletion,
        recovery: (item, itemPath) =>
          validateRecovery(item, itemPath, [
            "executions_sealed",
            "client_commit_confirmed",
            "dispatch_recorded",
            "awaiting_completion",
          ]),
      };
      break;
    case "quarantined_cancelled":
      stateShape = {
        claim: validateNoClaim,
        reservation: validateReservation,
        recovery: (item, itemPath) => validateRecovery(item, itemPath, ["executions_reserved"]),
        tombstone: validateTombstone,
      };
      break;
    case "reconciled_completed":
      stateShape = {
        claim: validateNoClaim,
        reservation: validateReservation,
        seal: validateSeal,
        client_commit: validateClientCommit,
        dispatch: validateDispatch,
        dispatch_effect_status: validateDispatchEffect,
        completion_status: validateCompletion,
        recovery: (item, itemPath) =>
          validateRecovery(item, itemPath, [
            "executions_sealed",
            "client_commit_confirmed",
            "dispatch_recorded",
            "awaiting_completion",
          ]),
        reconciliation: (item, itemPath) => validateReconciliation(item, itemPath, "completed"),
      };
      break;
    case "reconciled_unresolved": {
      const origin = readDiscriminator(value, path, "reconciliation_origin");
      const common: ObjectShape = {
        reconciliation_origin: validateLiteral(origin),
        claim: validateNoClaim,
        reservation: validateReservation,
        seal: validateSeal,
        reconciliation: (item, itemPath) => validateReconciliation(item, itemPath, "unresolved"),
      };
      if (origin === "sealed_undispatched") {
        stateShape = {
          ...common,
          client_commit_status: validateClientCommitStatus,
          recovery: (item, itemPath) =>
            validateRecovery(item, itemPath, ["executions_sealed", "client_commit_confirmed"]),
        };
      } else if (origin === "dispatched") {
        stateShape = {
          ...common,
          client_commit: validateClientCommit,
          dispatch: validateDispatch,
          dispatch_effect_status: validateDispatchEffect,
          completion_status: validateCompletion,
          recovery: (item, itemPath) =>
            validateRecovery(item, itemPath, [
              "executions_sealed",
              "client_commit_confirmed",
              "dispatch_recorded",
              "awaiting_completion",
            ]),
        };
      } else {
        fail("invalid_discriminator", `${path}.reconciliation_origin`, `Unknown reconciliation origin: ${origin}.`);
      }
      break;
    }
    default:
      fail("invalid_discriminator", `${path}.state`, `Unknown batch state: ${state}.`);
  }

  const record = validateExactObject(value, path, {
    ...snapshotBaseShape,
    state: validateLiteral(state),
    ...stateShape,
  });
  const stateClaim = requireRecord(record.claim, `${path}.claim`);
  const batchHead = requireRecord(record.batch_head, `${path}.batch_head`);
  if (batchHead.state !== state) {
    fail("invalid_scalar", `${path}.batch_head.state`, "Batch-head state must match snapshot state.");
  }
  const binding = requireRecord(record.binding, `${path}.binding`);
  if (binding.owner_batch_id !== batchHead.owner_batch_id) {
    fail(
      "invalid_scalar",
      `${path}.binding.owner_batch_id`,
      "Snapshot binding and batch head must identify the same batch.",
    );
  }
  const logicalUnits = record.logical_units as unknown[];
  if (binding.logical_unit_count !== logicalUnits.length) {
    fail("invalid_scalar", `${path}.binding.logical_unit_count`, "Binding logical-unit count does not match snapshot units.");
  }
  const snapshotGlobalHead = requireRecord(record.global_head, `${path}.global_head`);
  if ((snapshotGlobalHead.lifetime_logical_unit_count as number) < (binding.logical_unit_count as number)) {
    fail(
      "invalid_scalar",
      `${path}.global_head.lifetime_logical_unit_count`,
      "Global lifetime logical-unit count cannot be below the snapshot binding count.",
    );
  }
  if (stateClaim.kind !== "none" && (snapshotGlobalHead.active_claim_count as number) < 1) {
    fail(
      "invalid_scalar",
      `${path}.global_head.active_claim_count`,
      "A snapshot with a current claim requires at least one active global claim.",
    );
  }

  if (Object.hasOwn(record, "reservation")) {
    const reservation = requireRecord(record.reservation, `${path}.reservation`);
    const allocations = reservation.allocations as unknown[];
    const allocationCount = reservation.allocation_count as number;
    if (
      state !== "completed" &&
      state !== "quarantined_cancelled" &&
      state !== "reconciled_completed" &&
      state !== "reconciled_unresolved" &&
      (snapshotGlobalHead.active_reserved_execution_count as number) < allocationCount
    ) {
      fail(
        "invalid_scalar",
        `${path}.global_head.active_reserved_execution_count`,
        "A non-terminal reserved snapshot requires enough active reserved execution capacity.",
      );
    }
    if ((snapshotGlobalHead.lifetime_task_id_count as number) < allocationCount) {
      fail(
        "invalid_scalar",
        `${path}.global_head.lifetime_task_id_count`,
        "Global lifetime task-ID count cannot be below the reservation allocation count.",
      );
    }
    if ((snapshotGlobalHead.lifetime_execution_id_count as number) < allocationCount) {
      fail(
        "invalid_scalar",
        `${path}.global_head.lifetime_execution_id_count`,
        "Global lifetime execution-ID count cannot be below the reservation allocation count.",
      );
    }
    requireEqual(
      reservation.logical_unit_collection_root,
      binding.logical_unit_collection_root,
      `${path}.reservation.logical_unit_collection_root`,
      "Reservation and binding logical-unit roots must match.",
    );
    requireEqual(
      reservation.allocation_count,
      binding.logical_unit_count,
      `${path}.reservation.allocation_count`,
      "Reservation allocation count must match the binding logical-unit count.",
    );
    for (let index = 0; index < logicalUnits.length; index += 1) {
      const logicalUnit = requireRecord(logicalUnits[index], `${path}.logical_units[${index}]`);
      const allocation = requireRecord(allocations[index], `${path}.reservation.allocations[${index}]`);
      for (const key of ["logical_unit_hash", "execution_binding_hash", "workload_class_hash"] as const) {
        requireEqual(
          allocation[key],
          logicalUnit[key],
          `${path}.reservation.allocations[${index}].${key}`,
          `Reservation allocation ${key} must match the logical unit.`,
        );
      }
    }

    const identityCollectionHash = reservation.identity_collection_hash;
    const claim = requireRecord(record.claim, `${path}.claim`);
    if (claim.kind === "reconciliation_only") {
      requireEqual(
        claim.original_identity_collection_hash,
        identityCollectionHash,
        `${path}.claim.original_identity_collection_hash`,
        "Reconciliation claim must preserve the reservation identity collection.",
      );
    }
    for (const key of ["recovery", "tombstone", "reconciliation"] as const) {
      if (Object.hasOwn(record, key)) {
        const identityFact = requireRecord(record[key], `${path}.${key}`);
        requireEqual(
          identityFact.original_identity_collection_hash,
          identityCollectionHash,
          `${path}.${key}.original_identity_collection_hash`,
          `${key} must preserve the reservation identity collection.`,
        );
      }
    }
    if (Object.hasOwn(record, "tombstone")) {
      const tombstone = requireRecord(record.tombstone, `${path}.tombstone`);
      requireEqual(
        tombstone.reservation_hash,
        reservation.reservation_hash,
        `${path}.tombstone.reservation_hash`,
        "Tombstone must identify the snapshot reservation.",
      );
    }

    if (Object.hasOwn(record, "seal")) {
      const seal = requireRecord(record.seal, `${path}.seal`);
      requireEqual(
        seal.reservation_hash,
        reservation.reservation_hash,
        `${path}.seal.reservation_hash`,
        "Seal must identify the snapshot reservation.",
      );
      requireEqual(
        seal.allocation_count,
        reservation.allocation_count,
        `${path}.seal.allocation_count`,
        "Seal allocation count must match the reservation.",
      );
      requireTimestampAtOrAfter(
        seal.sealed_at,
        reservation.reserved_at,
        `${path}.seal.sealed_at`,
        "Seal time cannot precede reservation time.",
      );

      const commitKey = Object.hasOwn(record, "client_commit")
        ? "client_commit"
        : Object.hasOwn(record, "client_commit_status") &&
            requireRecord(record.client_commit_status, `${path}.client_commit_status`).kind === "confirmed"
          ? "client_commit_status"
          : null;
      if (commitKey !== null) {
        const clientCommit = requireRecord(record[commitKey], `${path}.${commitKey}`);
        requireEqual(
          clientCommit.execution_manifest_hash,
          seal.execution_manifest_hash,
          `${path}.${commitKey}.execution_manifest_hash`,
          "Client commit and seal execution manifests must match.",
        );
        requireTimestampAtOrAfter(
          clientCommit.confirmed_at,
          seal.sealed_at,
          `${path}.${commitKey}.confirmed_at`,
          "Client commit confirmation cannot precede sealing.",
        );
      }

      if (Object.hasOwn(record, "dispatch")) {
        const dispatch = requireRecord(record.dispatch, `${path}.dispatch`);
        const clientCommit = requireRecord(record.client_commit, `${path}.client_commit`);
        requireEqual(dispatch.seal_hash, seal.seal_hash, `${path}.dispatch.seal_hash`, "Dispatch must identify the seal.");
        requireEqual(
          dispatch.client_commit_hash,
          clientCommit.client_commit_hash,
          `${path}.dispatch.client_commit_hash`,
          "Dispatch must identify the client commit.",
        );
        requireEqual(
          dispatch.execution_manifest_hash,
          seal.execution_manifest_hash,
          `${path}.dispatch.execution_manifest_hash`,
          "Dispatch and seal execution manifests must match.",
        );
        requireTimestampAtOrAfter(
          dispatch.recorded_at,
          clientCommit.confirmed_at,
          `${path}.dispatch.recorded_at`,
          "Dispatch recording cannot precede client commit confirmation.",
        );
        if (Object.hasOwn(record, "dispatch_effect_status")) {
          const effect = requireRecord(record.dispatch_effect_status, `${path}.dispatch_effect_status`);
          requireEqual(
            effect.dispatch_commit_hash,
            dispatch.dispatch_commit_hash,
            `${path}.dispatch_effect_status.dispatch_commit_hash`,
            "Dispatch effect must identify the committed dispatch.",
          );
          if (effect.kind === "started") {
            requireTimestampAtOrAfter(
              effect.effect_started_at,
              dispatch.recorded_at,
              `${path}.dispatch_effect_status.effect_started_at`,
              "Dispatch effect start cannot precede dispatch recording.",
            );
          }
        }
      }
    }

    if (Object.hasOwn(record, "completion_status")) {
      const completion = requireRecord(record.completion_status, `${path}.completion_status`);
      requireEqual(
        completion.expected_count,
        reservation.allocation_count,
        `${path}.completion_status.expected_count`,
        "Completion expected count must match the reservation allocation count.",
      );
      if (state === "reconciled_completed") {
        const reconciliation = requireRecord(record.reconciliation, `${path}.reconciliation`);
        requireEqual(
          reconciliation.completion_collection_root,
          completion.collection_root,
          `${path}.reconciliation.completion_collection_root`,
          "Completed reconciliation must preserve the completion collection root.",
        );
        requireEqual(
          reconciliation.lifecycle_head,
          completion.lifecycle_head,
          `${path}.reconciliation.lifecycle_head`,
          "Completed reconciliation must preserve the completion lifecycle head.",
        );
      }
    }

    if (Object.hasOwn(record, "recovery")) {
      const recovery = requireRecord(record.recovery, `${path}.recovery`);
      let originTimestamp: unknown;
      switch (recovery.origin_state) {
        case "executions_reserved":
          originTimestamp = reservation.reserved_at;
          break;
        case "executions_sealed":
          originTimestamp = requireRecord(record.seal, `${path}.seal`).sealed_at;
          break;
        case "client_commit_confirmed": {
          const commit = Object.hasOwn(record, "client_commit")
            ? requireRecord(record.client_commit, `${path}.client_commit`)
            : requireRecord(record.client_commit_status, `${path}.client_commit_status`);
          originTimestamp = commit.confirmed_at;
          break;
        }
        case "dispatch_recorded":
          originTimestamp = requireRecord(record.dispatch, `${path}.dispatch`).recorded_at;
          break;
        case "awaiting_completion":
          originTimestamp = requireRecord(record.dispatch_effect_status, `${path}.dispatch_effect_status`).effect_started_at;
          break;
      }
      if (originTimestamp !== undefined) {
        requireTimestampAtOrAfter(
          recovery.entered_at,
          originTimestamp,
          `${path}.recovery.entered_at`,
          "Recovery entry cannot precede the fact identified by its origin state.",
        );
      }
      if (Object.hasOwn(record, "dispatch") &&
          (recovery.origin_state === "executions_sealed" || recovery.origin_state === "client_commit_confirmed")) {
        const dispatch = requireRecord(record.dispatch, `${path}.dispatch`);
        requireTimestampAtOrAfter(
          dispatch.recorded_at,
          recovery.entered_at,
          `${path}.dispatch.recorded_at`,
          "A recovery-time dispatch cannot precede recovery entry.",
        );
      }
      if (recovery.origin_state === "executions_sealed") {
        const recoveryCommitKey = Object.hasOwn(record, "client_commit")
          ? "client_commit"
          : Object.hasOwn(record, "client_commit_status") &&
              requireRecord(record.client_commit_status, `${path}.client_commit_status`).kind === "confirmed"
            ? "client_commit_status"
            : null;
        if (recoveryCommitKey !== null) {
          const recoveryCommit = requireRecord(record[recoveryCommitKey], `${path}.${recoveryCommitKey}`);
          requireTimestampAtOrAfter(
            recoveryCommit.confirmed_at,
            recovery.entered_at,
            `${path}.${recoveryCommitKey}.confirmed_at`,
            "A commit confirmed after sealed-state recovery entry cannot precede that recovery entry.",
          );
        }
      }
      if (Object.hasOwn(record, "dispatch_effect_status")) {
        const effect = requireRecord(record.dispatch_effect_status, `${path}.dispatch_effect_status`);
        if (
          effect.kind === "started" &&
          (recovery.origin_state === "executions_sealed" ||
            recovery.origin_state === "client_commit_confirmed" ||
            recovery.origin_state === "dispatch_recorded")
        ) {
          requireTimestampAtOrAfter(
            effect.effect_started_at,
            recovery.entered_at,
            `${path}.dispatch_effect_status.effect_started_at`,
            "A recovery-time dispatch effect cannot precede recovery entry.",
          );
        }
      }
      if (stateClaim.kind === "reconciliation_only") {
        requireTimestampAtOrAfter(
          stateClaim.owner_issued_at,
          recovery.entered_at,
          `${path}.claim.owner_issued_at`,
          "Reconciliation claim issuance cannot precede recovery entry.",
        );
      }
      if (Object.hasOwn(record, "tombstone")) {
        const tombstone = requireRecord(record.tombstone, `${path}.tombstone`);
        requireTimestampAtOrAfter(
          tombstone.cancelled_at,
          recovery.entered_at,
          `${path}.tombstone.cancelled_at`,
          "Tombstone cancellation cannot precede recovery entry.",
        );
      }
      if (Object.hasOwn(record, "reconciliation")) {
        const reconciliation = requireRecord(record.reconciliation, `${path}.reconciliation`);
        requireTimestampAtOrAfter(
          reconciliation.reconciled_at,
          recovery.entered_at,
          `${path}.reconciliation.reconciled_at`,
          "Reconciliation cannot precede recovery entry.",
        );
      }
    }
  }

  if (state === "dispatch_recorded") {
    if (readDiscriminator(record.dispatch_effect_status, `${path}.dispatch_effect_status`, "kind") !== "recorded") {
      fail("invalid_discriminator", `${path}.dispatch_effect_status.kind`, "dispatch_recorded requires recorded effect status.");
    }
    if (readDiscriminator(record.completion_status, `${path}.completion_status`, "kind") !== "none") {
      fail("invalid_discriminator", `${path}.completion_status.kind`, "dispatch_recorded requires no completion.");
    }
  }
  if (state === "awaiting_completion" || state === "completed" || state === "reconciled_completed") {
    if (readDiscriminator(record.dispatch_effect_status, `${path}.dispatch_effect_status`, "kind") !== "started") {
      fail("invalid_discriminator", `${path}.dispatch_effect_status.kind`, `${state} requires started effect status.`);
    }
  }
  if (
    state === "awaiting_completion" &&
    readDiscriminator(record.completion_status, `${path}.completion_status`, "kind") === "all_terminal"
  ) {
    fail(
      "invalid_discriminator",
      `${path}.completion_status.kind`,
      "awaiting_completion permits only none or partial completion.",
    );
  }
  if ((state === "completed" || state === "reconciled_completed") && readDiscriminator(record.completion_status, `${path}.completion_status`, "kind") !== "all_terminal") {
    fail("invalid_discriminator", `${path}.completion_status.kind`, `${state} requires all-terminal completion.`);
  }
  if (state === "recovery_required_dispatched") {
    const effect = readDiscriminator(record.dispatch_effect_status, `${path}.dispatch_effect_status`, "kind");
    const completion = readDiscriminator(record.completion_status, `${path}.completion_status`, "kind");
    const recoveryOrigin = readDiscriminator(record.recovery, `${path}.recovery`, "origin_state");
    if (effect === "recorded" && completion !== "none") {
      fail("invalid_discriminator", `${path}.completion_status.kind`, "Recorded effect status permits only no completion.");
    }
    if (recoveryOrigin === "awaiting_completion" && effect !== "started") {
      fail(
        "invalid_discriminator",
        `${path}.dispatch_effect_status.kind`,
        "An awaiting-completion recovery origin requires a started dispatch effect.",
      );
    }
  }
  if (
    (state === "recovery_required_sealed_undispatched" ||
      (state === "reconciled_unresolved" && record.reconciliation_origin === "sealed_undispatched")) &&
    readDiscriminator(record.recovery, `${path}.recovery`, "origin_state") === "client_commit_confirmed" &&
    readDiscriminator(record.client_commit_status, `${path}.client_commit_status`, "kind") !== "confirmed"
  ) {
    fail(
      "invalid_discriminator",
      `${path}.client_commit_status.kind`,
      "A client-commit-confirmed recovery origin requires confirmed client commit status.",
    );
  }
  if (state === "reconciled_unresolved" && record.reconciliation_origin === "dispatched") {
    if (readDiscriminator(record.dispatch_effect_status, `${path}.dispatch_effect_status`, "kind") !== "started") {
      fail("invalid_discriminator", `${path}.dispatch_effect_status.kind`, "Dispatched reconciliation requires started effect status.");
    }
    if (readDiscriminator(record.completion_status, `${path}.completion_status`, "kind") !== "all_terminal") {
      fail("invalid_discriminator", `${path}.completion_status.kind`, "Dispatched reconciliation requires all-terminal completion.");
    }
    const reconciliation = requireRecord(record.reconciliation, `${path}.reconciliation`);
    const completionStatus = requireRecord(record.completion_status, `${path}.completion_status`);
    requireEqual(
      reconciliation.completion_collection_root,
      completionStatus.collection_root,
      `${path}.reconciliation.completion_collection_root`,
      "Dispatched unresolved reconciliation must preserve the all-terminal completion collection root.",
    );
    requireEqual(
      reconciliation.lifecycle_head,
      completionStatus.lifecycle_head,
      `${path}.reconciliation.lifecycle_head`,
      "Dispatched unresolved reconciliation must preserve the all-terminal completion lifecycle head.",
    );
  }
  if (state === "reconciled_unresolved" && record.reconciliation_origin === "sealed_undispatched") {
    const reconciliation = requireRecord(record.reconciliation, `${path}.reconciliation`);
    if (reconciliation.completion_collection_root !== null || reconciliation.lifecycle_head !== null) {
      fail(
        "invalid_scalar",
        `${path}.reconciliation.completion_collection_root`,
        "Sealed-undispatched unresolved reconciliation cannot claim completion roots.",
      );
    }
  }
}

function validateEventCausation(value: unknown, path: string): void {
  const kind = readDiscriminator(value, path, "kind");
  if (kind === "client_command") {
    validateExactObject(value, path, {
      kind: validateLiteral(kind),
      command_id: validateProtocolIdOrRef,
      idempotency_key: validateProtocolIdOrRef,
      request_hash: validateHash,
    });
  } else if (kind === "owner_worker" || kind === "watchdog") {
    validateExactObject(value, path, {
      kind: validateLiteral(kind),
      internal_idempotency_key: validateProtocolIdOrRef,
    });
  } else {
    fail("invalid_discriminator", `${path}.kind`, `Unknown event causation: ${kind}.`);
  }
}

const eventCommonShape: ObjectShape = {
    event_id: validateProtocolIdOrRef,
    causation: validateEventCausation,
    ledger_sequence: validateCanonicalDecimal,
    previous_event_hash: validateNullable(validateHash),
    owner_event_at: validateOwnerTimestamp,
    capacity_delta: validateCapacityDelta,
    fact_root: validateHash,
    event_hash: validateHash,
};

function validateOwnerEventLedger(record: JsonRecord, path: string): void {
  const sequence = record.ledger_sequence as string;
  if (BigInt(sequence) < 1n) {
    fail("invalid_scalar", `${path}.ledger_sequence`, "Owner event ledger sequence must be at least 1.");
  }
  if ((record.previous_event_hash === null) !== (sequence === "1")) {
    fail(
      "invalid_scalar",
      `${path}.previous_event_hash`,
      "Owner event previous hash must be null exactly at ledger sequence 1.",
    );
  }
}

function validateBatchEvent(value: unknown, path: string): void {
  const record = validateExactObject(value, path, {
    ...eventCommonShape,
    event_type: validateOneOf([
      "batch_opened",
      "batch_claimed",
      "batch_claim_renewed",
      "batch_claim_released",
      "executions_reserved",
      "execution_manifest_sealed",
      "client_commit_confirmed",
      "dispatch_recorded",
      "dispatch_effect_started",
      "execution_completion_recorded",
      "claim_expired",
      "reservation_quarantined",
      "batch_reconciled",
    ]),
    stream: (stream, streamPath) =>
      validateExactObject(stream, streamPath, {
        kind: validateLiteral("batch"),
        owner_batch_id: validateProtocolIdOrRef,
      }),
  });
  validateOwnerEventLedger(record, path);
  const causation = requireRecord(record.causation, `${path}.causation`);
  const expectedCausationKind = batchEventCausationKinds[record.event_type as string];
  if (causation.kind !== expectedCausationKind) {
    fail(
      "invalid_scalar",
      `${path}.causation.kind`,
      `Batch event ${record.event_type as string} requires ${expectedCausationKind} causation.`,
    );
  }
}

function validateGlobalEvent(value: unknown, path: string): void {
  const record = validateExactObject(value, path, {
    ...eventCommonShape,
    event_type: validateOneOf([
      "global_admission_changed",
      "global_uniqueness_changed",
      "global_capacity_changed",
    ]),
    stream: (stream, streamPath) =>
      validateExactObject(stream, streamPath, {
        kind: validateLiteral("global"),
        owner_namespace: validateProtocolIdOrRef,
      }),
  });
  validateOwnerEventLedger(record, path);
}

function equalJson(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((item, index) => equalJson(item, right[index]))
    );
  }
  if (!isRecord(left) || !isRecord(right)) return false;
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every((key, index) => key === rightKeys[index] && equalJson(left[key], right[key]))
  );
}

function requireEqual(left: unknown, right: unknown, path: string, message: string): void {
  if (!equalJson(left, right)) fail("invalid_scalar", path, message);
}

function requireNextDecimal(before: unknown, after: unknown, path: string): void {
  if (typeof before !== "string" || typeof after !== "string" || BigInt(after) !== BigInt(before) + 1n) {
    fail("invalid_scalar", path, "After sequence/version must be exactly before + 1.");
  }
}

function validateCapacityArithmetic(
  before: JsonRecord,
  after: JsonRecord,
  delta: JsonRecord,
  path: string,
): void {
  for (const key of [
    "active_claim_count",
    "active_reserved_execution_count",
    "lifetime_logical_unit_count",
    "lifetime_task_id_count",
    "lifetime_execution_id_count",
  ] as const) {
    if ((after[key] as number) !== (before[key] as number) + (delta[key] as number)) {
      fail("invalid_scalar", `${path}.${key}`, `After global counter must equal before + capacity delta for ${key}.`);
    }
  }
}

function expectedCapacityDeltaForEvent(batchEvent: JsonRecord, snapshot: JsonRecord): JsonRecord {
  const zero = {
    active_claim_count: 0,
    active_reserved_execution_count: 0,
    lifetime_logical_unit_count: 0,
    lifetime_task_id_count: 0,
    lifetime_execution_id_count: 0,
  };
  const eventType = batchEvent.event_type;
  const binding = requireRecord(snapshot.binding, "$.result_snapshot.binding");
  const logicalUnitCount = binding.logical_unit_count as number;
  const reservationCount = Object.hasOwn(snapshot, "reservation")
    ? (requireRecord(snapshot.reservation, "$.result_snapshot.reservation").allocation_count as number)
    : 0;

  if (eventType === "batch_opened") {
    return { ...zero, lifetime_logical_unit_count: logicalUnitCount };
  }
  if (eventType === "executions_reserved") {
    return {
      ...zero,
      active_reserved_execution_count: reservationCount,
      lifetime_task_id_count: reservationCount,
      lifetime_execution_id_count: reservationCount,
    };
  }
  if (eventType === "batch_claimed") return { ...zero, active_claim_count: 1 };
  if (eventType === "batch_claim_released" || eventType === "claim_expired") {
    return { ...zero, active_claim_count: -1 };
  }
  if (eventType === "reservation_quarantined" || eventType === "batch_reconciled") {
    return { ...zero, active_claim_count: -1, active_reserved_execution_count: -reservationCount };
  }
  if (eventType === "execution_completion_recorded" && snapshot.state === "completed") {
    return { ...zero, active_claim_count: -1, active_reserved_execution_count: -reservationCount };
  }
  return zero;
}

function batchTransitionKey(beforeState: string | null, afterState: string): string {
  return `${beforeState ?? "<absent>"}->${afterState}`;
}

const terminalBatchStates = new Set([
  "completed",
  "quarantined_cancelled",
  "reconciled_completed",
  "reconciled_unresolved",
]);

const batchEventTransitions: Readonly<Record<string, ReadonlySet<string>>> = {
  batch_opened: new Set([batchTransitionKey(null, "planned")]),
  batch_claimed: new Set([
    batchTransitionKey("planned", "planned"),
    batchTransitionKey("recovery_required_reserved_unsealed", "recovery_required_reserved_unsealed"),
    batchTransitionKey("recovery_required_sealed_undispatched", "recovery_required_sealed_undispatched"),
    batchTransitionKey("recovery_required_dispatched", "recovery_required_dispatched"),
  ]),
  batch_claim_renewed: new Set([
    batchTransitionKey("planned", "planned"),
    batchTransitionKey("executions_reserved", "executions_reserved"),
    batchTransitionKey("executions_sealed", "executions_sealed"),
    batchTransitionKey("client_commit_confirmed", "client_commit_confirmed"),
    batchTransitionKey("dispatch_recorded", "dispatch_recorded"),
    batchTransitionKey("awaiting_completion", "awaiting_completion"),
    batchTransitionKey("recovery_required_reserved_unsealed", "recovery_required_reserved_unsealed"),
    batchTransitionKey("recovery_required_sealed_undispatched", "recovery_required_sealed_undispatched"),
    batchTransitionKey("recovery_required_dispatched", "recovery_required_dispatched"),
  ]),
  batch_claim_released: new Set([
    batchTransitionKey("planned", "planned"),
    batchTransitionKey("executions_reserved", "recovery_required_reserved_unsealed"),
    batchTransitionKey("executions_sealed", "recovery_required_sealed_undispatched"),
    batchTransitionKey("client_commit_confirmed", "recovery_required_sealed_undispatched"),
    batchTransitionKey("dispatch_recorded", "recovery_required_dispatched"),
    batchTransitionKey("awaiting_completion", "recovery_required_dispatched"),
    batchTransitionKey("recovery_required_reserved_unsealed", "recovery_required_reserved_unsealed"),
    batchTransitionKey("recovery_required_sealed_undispatched", "recovery_required_sealed_undispatched"),
    batchTransitionKey("recovery_required_dispatched", "recovery_required_dispatched"),
  ]),
  executions_reserved: new Set([batchTransitionKey("planned", "executions_reserved")]),
  execution_manifest_sealed: new Set([batchTransitionKey("executions_reserved", "executions_sealed")]),
  client_commit_confirmed: new Set([
    batchTransitionKey("executions_sealed", "client_commit_confirmed"),
    batchTransitionKey("recovery_required_sealed_undispatched", "recovery_required_sealed_undispatched"),
  ]),
  dispatch_recorded: new Set([
    batchTransitionKey("client_commit_confirmed", "dispatch_recorded"),
    batchTransitionKey("recovery_required_sealed_undispatched", "recovery_required_dispatched"),
  ]),
  dispatch_effect_started: new Set([
    batchTransitionKey("dispatch_recorded", "awaiting_completion"),
    batchTransitionKey("recovery_required_dispatched", "recovery_required_dispatched"),
  ]),
  execution_completion_recorded: new Set([
    batchTransitionKey("awaiting_completion", "awaiting_completion"),
    batchTransitionKey("awaiting_completion", "completed"),
    batchTransitionKey("recovery_required_dispatched", "recovery_required_dispatched"),
  ]),
  claim_expired: new Set([
    batchTransitionKey("planned", "planned"),
    batchTransitionKey("executions_reserved", "recovery_required_reserved_unsealed"),
    batchTransitionKey("executions_sealed", "recovery_required_sealed_undispatched"),
    batchTransitionKey("client_commit_confirmed", "recovery_required_sealed_undispatched"),
    batchTransitionKey("dispatch_recorded", "recovery_required_dispatched"),
    batchTransitionKey("awaiting_completion", "recovery_required_dispatched"),
    batchTransitionKey("recovery_required_reserved_unsealed", "recovery_required_reserved_unsealed"),
    batchTransitionKey("recovery_required_sealed_undispatched", "recovery_required_sealed_undispatched"),
    batchTransitionKey("recovery_required_dispatched", "recovery_required_dispatched"),
  ]),
  reservation_quarantined: new Set([
    batchTransitionKey("recovery_required_reserved_unsealed", "quarantined_cancelled"),
  ]),
  batch_reconciled: new Set([
    batchTransitionKey("recovery_required_sealed_undispatched", "reconciled_unresolved"),
    batchTransitionKey("recovery_required_dispatched", "reconciled_completed"),
    batchTransitionKey("recovery_required_dispatched", "reconciled_unresolved"),
  ]),
};

const batchEventCausationKinds: Readonly<Record<string, "client_command" | "owner_worker" | "watchdog">> = {
  batch_opened: "client_command",
  batch_claimed: "client_command",
  batch_claim_renewed: "client_command",
  batch_claim_released: "client_command",
  executions_reserved: "client_command",
  execution_manifest_sealed: "client_command",
  client_commit_confirmed: "client_command",
  dispatch_recorded: "client_command",
  dispatch_effect_started: "owner_worker",
  execution_completion_recorded: "owner_worker",
  claim_expired: "watchdog",
  reservation_quarantined: "client_command",
  batch_reconciled: "client_command",
};

function validateBatchEventTransition(
  eventType: string,
  causationKind: string,
  beforeState: string | null,
  afterState: string,
  path: string,
): void {
  if (beforeState !== null && terminalBatchStates.has(beforeState)) {
    fail("invalid_scalar", `${path}.before_batch_head.state`, "Terminal batch states have no outgoing transitions.");
  }
  const allowed = batchEventTransitions[eventType];
  if (allowed === undefined || !allowed.has(batchTransitionKey(beforeState, afterState))) {
    fail(
      "invalid_scalar",
      `${path}.batch_event.event_type`,
      `Batch event ${eventType} does not permit transition ${beforeState ?? "absent"} -> ${afterState}.`,
    );
  }
  if (batchEventCausationKinds[eventType] !== causationKind) {
    fail(
      "invalid_scalar",
      `${path}.batch_event.causation.kind`,
      `Batch event ${eventType} requires ${batchEventCausationKinds[eventType]} causation.`,
    );
  }
}

function validateBatchEventClaimOverlay(
  eventType: string,
  afterState: string,
  snapshot: JsonRecord,
  path: string,
): void {
  const claim = requireRecord(snapshot.claim, `${path}.result_snapshot.claim`);
  const claimKind = claim.kind as string;
  let allowedClaimKinds: readonly string[];
  if (eventType === "batch_opened" || eventType === "batch_claim_released" || eventType === "claim_expired") {
    allowedClaimKinds = ["none"];
  } else if (eventType === "reservation_quarantined" || eventType === "batch_reconciled" || afterState === "completed") {
    allowedClaimKinds = ["none"];
  } else if (eventType === "batch_claimed" || eventType === "batch_claim_renewed") {
    allowedClaimKinds = afterState.startsWith("recovery_required_") ? ["reconciliation_only"] : ["ordinary"];
  } else if (afterState.startsWith("recovery_required_")) {
    allowedClaimKinds =
      eventType === "dispatch_effect_started" || eventType === "execution_completion_recorded"
        ? ["none", "reconciliation_only"]
        : ["reconciliation_only"];
  } else {
    allowedClaimKinds = ["ordinary"];
  }
  if (!allowedClaimKinds.includes(claimKind)) {
    fail(
      "invalid_scalar",
      `${path}.result_snapshot.claim.kind`,
      `Batch event ${eventType} requires result claim kind ${allowedClaimKinds.join(" or ")}.`,
    );
  }
}

function requireSnapshotProgressKind(
  snapshot: JsonRecord,
  containerKey: "client_commit_status" | "dispatch_effect_status" | "completion_status",
  allowedKinds: readonly string[],
  path: string,
  eventType: string,
): void {
  const container = requireRecord(snapshot[containerKey], `${path}.result_snapshot.${containerKey}`);
  if (!allowedKinds.includes(container.kind as string)) {
    fail(
      "invalid_scalar",
      `${path}.result_snapshot.${containerKey}.kind`,
      `Batch event ${eventType} requires ${containerKey} kind ${allowedKinds.join(" or ")}.`,
    );
  }
}

function validateBatchEventResultFacts(
  eventType: string,
  beforeState: string | null,
  snapshot: JsonRecord,
  path: string,
): void {
  if (eventType === "client_commit_confirmed" && Object.hasOwn(snapshot, "client_commit_status")) {
    requireSnapshotProgressKind(snapshot, "client_commit_status", ["confirmed"], path, eventType);
    const recovery = requireRecord(snapshot.recovery, `${path}.result_snapshot.recovery`);
    if (recovery.origin_state !== "executions_sealed") {
      fail(
        "invalid_scalar",
        `${path}.result_snapshot.recovery.origin_state`,
        "Client commit inside recovery can advance only a recovery entered from executions_sealed.",
      );
    }
  }
  if (eventType === "dispatch_recorded") {
    requireSnapshotProgressKind(snapshot, "dispatch_effect_status", ["recorded"], path, eventType);
    requireSnapshotProgressKind(snapshot, "completion_status", ["none"], path, eventType);
    if (beforeState === "recovery_required_sealed_undispatched") {
      const recovery = requireRecord(snapshot.recovery, `${path}.result_snapshot.recovery`);
      if (recovery.origin_state !== "executions_sealed" && recovery.origin_state !== "client_commit_confirmed") {
        fail(
          "invalid_scalar",
          `${path}.result_snapshot.recovery.origin_state`,
          "Dispatch from sealed-undispatched recovery must preserve its sealed or client-commit entry origin.",
        );
      }
    }
  }
  if (eventType === "dispatch_effect_started") {
    requireSnapshotProgressKind(snapshot, "dispatch_effect_status", ["started"], path, eventType);
    requireSnapshotProgressKind(snapshot, "completion_status", ["none"], path, eventType);
    if (Object.hasOwn(snapshot, "recovery")) {
      const recovery = requireRecord(snapshot.recovery, `${path}.result_snapshot.recovery`);
      if (recovery.origin_state === "awaiting_completion") {
        fail(
          "invalid_scalar",
          `${path}.result_snapshot.recovery.origin_state`,
          "A recovery entered from awaiting_completion already has a started dispatch effect.",
        );
      }
    }
  }
  if (eventType === "execution_completion_recorded") {
    requireSnapshotProgressKind(snapshot, "dispatch_effect_status", ["started"], path, eventType);
    requireSnapshotProgressKind(snapshot, "completion_status", ["partial", "all_terminal"], path, eventType);
  }
  if (
    (eventType === "batch_claim_released" || eventType === "claim_expired") &&
    beforeState !== null &&
    [
      "executions_reserved",
      "executions_sealed",
      "client_commit_confirmed",
      "dispatch_recorded",
      "awaiting_completion",
    ].includes(beforeState)
  ) {
    const recovery = requireRecord(snapshot.recovery, `${path}.result_snapshot.recovery`);
    if (recovery.origin_state !== beforeState) {
      fail(
        "invalid_scalar",
        `${path}.result_snapshot.recovery.origin_state`,
        `${eventType} must preserve the exact forward state that entered recovery.`,
      );
    }
    if (beforeState === "executions_sealed") {
      requireSnapshotProgressKind(snapshot, "client_commit_status", ["not_confirmed"], path, eventType);
    } else if (beforeState === "client_commit_confirmed") {
      requireSnapshotProgressKind(snapshot, "client_commit_status", ["confirmed"], path, eventType);
    } else if (beforeState === "dispatch_recorded") {
      requireSnapshotProgressKind(snapshot, "dispatch_effect_status", ["recorded"], path, eventType);
      requireSnapshotProgressKind(snapshot, "completion_status", ["none"], path, eventType);
    } else if (beforeState === "awaiting_completion") {
      requireSnapshotProgressKind(snapshot, "dispatch_effect_status", ["started"], path, eventType);
    }
  }
}

function validateAuthorityEnvelope(value: unknown, path: string): void {
  const record = validateExactObject(value, path, {
    schema_version: validateSchemaVersion,
    receipt_ref: validateProtocolIdOrRef,
    pins: validatePins,
    scope: validateScope,
    causation: validateEventCausation,
    before_batch_head: validateNullable(validateBatchHead),
    after_batch_head: validateBatchHead,
    before_global_head: validateGlobalHead,
    after_global_head: validateGlobalHead,
    batch_event: validateBatchEvent,
    global_event: validateGlobalEvent,
    capacity_delta: validateCapacityDelta,
    result_snapshot: validateSnapshot,
    dispatch_commit_hash: validateNullable(validateHash),
    owner_issued_at: validateOwnerTimestamp,
    authority_envelope_hash: validateHash,
  });

  const beforeBatch = record.before_batch_head === null ? null : requireRecord(record.before_batch_head, `${path}.before_batch_head`);
  const afterBatch = requireRecord(record.after_batch_head, `${path}.after_batch_head`);
  const beforeGlobal = requireRecord(record.before_global_head, `${path}.before_global_head`);
  const afterGlobal = requireRecord(record.after_global_head, `${path}.after_global_head`);
  const batchEvent = requireRecord(record.batch_event, `${path}.batch_event`);
  const globalEvent = requireRecord(record.global_event, `${path}.global_event`);
  const batchStream = requireRecord(batchEvent.stream, `${path}.batch_event.stream`);
  const globalStream = requireRecord(globalEvent.stream, `${path}.global_event.stream`);
  const delta = requireRecord(record.capacity_delta, `${path}.capacity_delta`);
  const snapshot = requireRecord(record.result_snapshot, `${path}.result_snapshot`);

  requireEqual(batchEvent.causation, record.causation, `${path}.batch_event.causation`, "Batch-event causation must equal envelope causation.");
  requireEqual(globalEvent.causation, record.causation, `${path}.global_event.causation`, "Global-event causation must equal envelope causation.");
  requireEqual(batchEvent.capacity_delta, delta, `${path}.batch_event.capacity_delta`, "Batch-event capacity delta must equal envelope delta.");
  requireEqual(globalEvent.capacity_delta, delta, `${path}.global_event.capacity_delta`, "Global-event capacity delta must equal envelope delta.");
  requireEqual(snapshot.batch_head, afterBatch, `${path}.result_snapshot.batch_head`, "Result snapshot batch head must equal envelope after-batch head.");
  requireEqual(snapshot.global_head, afterGlobal, `${path}.result_snapshot.global_head`, "Result snapshot global head must equal envelope after-global head.");
  requireEqual(snapshot.pins, record.pins, `${path}.result_snapshot.pins`, "Result snapshot pins must equal envelope pins.");
  requireEqual(snapshot.scope, record.scope, `${path}.result_snapshot.scope`, "Result snapshot scope must equal envelope scope.");
  requireEqual(
    batchEvent.fact_root,
    snapshot.snapshot_hash,
    `${path}.batch_event.fact_root`,
    "Batch-event fact root must bind the result snapshot hash.",
  );
  requireTimestampAtOrAfter(
    record.owner_issued_at,
    batchEvent.owner_event_at,
    `${path}.owner_issued_at`,
    "Authority envelope cannot be issued before its batch event.",
  );
  requireTimestampAtOrAfter(
    record.owner_issued_at,
    globalEvent.owner_event_at,
    `${path}.owner_issued_at`,
    "Authority envelope cannot be issued before its global event.",
  );
  requireSnapshotFactsNoLaterThan(snapshot, batchEvent.owner_event_at, `${path}.result_snapshot`);
  validateBatchEventTransition(
    batchEvent.event_type as string,
    readDiscriminator(batchEvent.causation, `${path}.batch_event.causation`, "kind"),
    beforeBatch === null ? null : (beforeBatch.state as string),
    afterBatch.state as string,
    path,
  );
  validateBatchEventClaimOverlay(batchEvent.event_type as string, afterBatch.state as string, snapshot, path);
  validateBatchEventResultFacts(
    batchEvent.event_type as string,
    beforeBatch === null ? null : (beforeBatch.state as string),
    snapshot,
    path,
  );

  if (Object.hasOwn(snapshot, "dispatch")) {
    const dispatch = requireRecord(snapshot.dispatch, `${path}.result_snapshot.dispatch`);
    requireEqual(
      record.dispatch_commit_hash,
      dispatch.dispatch_commit_hash,
      `${path}.dispatch_commit_hash`,
      "Envelope dispatch commit hash must equal the result snapshot dispatch commit hash.",
    );
  } else if (record.dispatch_commit_hash !== null) {
    fail(
      "invalid_scalar",
      `${path}.dispatch_commit_hash`,
      "Envelope dispatch commit hash must be null when the result snapshot has no dispatch.",
    );
  }

  if (batchStream.owner_batch_id !== afterBatch.owner_batch_id) {
    fail("invalid_scalar", `${path}.batch_event.stream.owner_batch_id`, "Batch event and after head must identify the same batch.");
  }
  const pins = requireRecord(record.pins, `${path}.pins`);
  if (globalStream.owner_namespace !== pins.owner_namespace) {
    fail("invalid_scalar", `${path}.global_event.stream.owner_namespace`, "Global event must use the pinned owner namespace.");
  }
  if (batchEvent.ledger_sequence !== afterBatch.ledger_sequence || batchEvent.event_hash !== afterBatch.last_event_hash) {
    fail("invalid_scalar", `${path}.after_batch_head`, "After batch head must be the committed batch event head.");
  }
  if (globalEvent.ledger_sequence !== afterGlobal.ledger_sequence || globalEvent.event_hash !== afterGlobal.last_event_hash) {
    fail("invalid_scalar", `${path}.after_global_head`, "After global head must be the committed global event head.");
  }

  if (beforeBatch === null) {
    if (batchEvent.previous_event_hash !== null || batchEvent.event_type !== "batch_opened") {
      fail("invalid_scalar", `${path}.batch_event`, "An absent before-batch head requires the initial batch-opened event.");
    }
    if (afterBatch.ledger_sequence !== "1" || afterBatch.snapshot_version !== "1") {
      fail(
        "invalid_scalar",
        `${path}.after_batch_head`,
        "An initial batch-opened event requires ledger sequence and snapshot version 1.",
      );
    }
  } else {
    if (beforeBatch.owner_batch_id !== afterBatch.owner_batch_id) {
      fail("invalid_scalar", `${path}.after_batch_head.owner_batch_id`, "Batch identity cannot change across a mutation.");
    }
    if (batchEvent.previous_event_hash !== beforeBatch.last_event_hash) {
      fail("invalid_scalar", `${path}.batch_event.previous_event_hash`, "Batch-event previous hash must equal the before head.");
    }
    requireNextDecimal(beforeBatch.ledger_sequence, afterBatch.ledger_sequence, `${path}.after_batch_head.ledger_sequence`);
    requireNextDecimal(beforeBatch.snapshot_version, afterBatch.snapshot_version, `${path}.after_batch_head.snapshot_version`);
  }
  if (globalEvent.previous_event_hash !== beforeGlobal.last_event_hash) {
    fail("invalid_scalar", `${path}.global_event.previous_event_hash`, "Global-event previous hash must equal the before head.");
  }
  requireNextDecimal(beforeGlobal.ledger_sequence, afterGlobal.ledger_sequence, `${path}.after_global_head.ledger_sequence`);
  requireNextDecimal(beforeGlobal.registry_version, afterGlobal.registry_version, `${path}.after_global_head.registry_version`);
  validateCapacityArithmetic(beforeGlobal, afterGlobal, delta, `${path}.after_global_head`);
  const expectedGlobalFactRoot =
    globalEvent.event_type === "global_uniqueness_changed"
      ? afterGlobal.uniqueness_root
      : afterGlobal.admission_root;
  requireEqual(
    globalEvent.fact_root,
    expectedGlobalFactRoot,
    `${path}.global_event.fact_root`,
    "Global-event fact root must bind the matching after-global root.",
  );
  requireEqual(
    delta,
    expectedCapacityDeltaForEvent(batchEvent, snapshot),
    `${path}.capacity_delta`,
    "Capacity delta does not match the batch event transition.",
  );
}

function validateReadPageBinding(value: unknown, path: string): void {
  const kind = readDiscriminator(value, path, "kind");
  if (kind === "singleton") {
    validateExactObject(value, path, {
      kind: validateLiteral(kind),
      cursor_start: validateLiteral(null),
      cursor_end: validateLiteral(null),
      limit: validateLiteral(1),
      item_count: validateLiteral(1),
      page_hash: validateHash,
      full_collection_root: validateHash,
    });
  } else if (kind === "collection_page") {
    const record = validateExactObject(value, path, {
      kind: validateLiteral(kind),
      cursor_start: validateCursor,
      cursor_end: validateCursor,
      next_cursor: validateCursor,
      limit: validatePageLimit,
      item_count: validateSafeInteger({
        minimum: 0,
        maximum: workflowBatchExecutionControlBoundsV1.max_page_size,
      }),
      page_hash: validateHash,
      full_collection_root: validateHash,
    });
    if ((record.item_count as number) > (record.limit as number)) {
      fail("invalid_scalar", `${path}.item_count`, "Collection item count cannot exceed the requested page limit.");
    }
  } else {
    fail("invalid_discriminator", `${path}.kind`, `Unknown read page kind: ${kind}.`);
  }
}

function validateCapabilityDescriptor(value: unknown, path: string): void {
  const record = validateExactObject(value, path, {
    schema_version: validateSchemaVersion,
    capability_family: validateLiteral("workflow_batch_execution_control_v1"),
    capability_version: validateLiteral(1),
    enabled: validateLiteral(true),
    supported_scope_kinds: validateArray(
      validateOneOf(["organization", "platform", "workspace"]),
      3,
      { minimum: 1, canonicalKey: canonicalStringItem },
    ),
    trust_mode: validateLiteral("opaque_owner_readback_v1"),
    pins: validatePins,
    limits: (limits, limitsPath) =>
      validateExactObject(limits, limitsPath, {
        min_lease_ttl_seconds: validateTtl,
        max_lease_ttl_seconds: validateTtl,
        max_reported_clock_skew_seconds: validateNonNegativeInteger,
        minimum_audit_retention_seconds: validatePositiveInteger,
        max_active_claims: validatePositiveInteger,
        max_active_reserved_executions: validatePositiveInteger,
        max_lifetime_logical_units: validatePositiveInteger,
        max_lifetime_task_ids: validatePositiveInteger,
        max_lifetime_execution_ids: validatePositiveInteger,
      }),
  });
  const limits = requireRecord(record.limits, `${path}.limits`);
  if ((limits.min_lease_ttl_seconds as number) > (limits.max_lease_ttl_seconds as number)) {
    fail(
      "invalid_scalar",
      `${path}.limits.min_lease_ttl_seconds`,
      "Capability minimum lease TTL cannot exceed its maximum lease TTL.",
    );
  }
}

function validateHistoryItem(value: unknown, path: string): void {
  validateExactObject(value, path, {
    owner_event: validateBatchEvent,
    authority_envelope_hash: validateHash,
    receipt_ref: validateProtocolIdOrRef,
  });
}

function validateUniquenessItem(value: unknown, path: string): void {
  const kind = readDiscriminator(value, path, "kind");
  if (kind === "logical_unit") {
    validateExactObject(value, path, {
      kind: validateLiteral(kind),
      logical_series_hash: validateHash,
      generation: validateNonNegativeInteger,
      logical_unit_hash: validateHash,
      owner_batch_id: validateProtocolIdOrRef,
    });
  } else if (kind === "owner_task_id") {
    validateExactObject(value, path, {
      kind: validateLiteral(kind),
      owner_task_id: validateProtocolIdOrRef,
      owner_batch_id: validateProtocolIdOrRef,
    });
  } else if (kind === "owner_execution_id") {
    validateExactObject(value, path, {
      kind: validateLiteral(kind),
      owner_execution_id: validateProtocolIdOrRef,
      owner_batch_id: validateProtocolIdOrRef,
    });
  } else {
    fail("invalid_discriminator", `${path}.kind`, `Unknown uniqueness item kind: ${kind}.`);
  }
}

function validateExecutionReceipt(value: unknown, path: string): void {
  const record = validateExactObject(value, path, {
    owner_execution_id: validateProtocolIdOrRef,
    terminal_status: validateOneOf(["succeeded", "failed", "cancelled"]),
    receipt_ref: validateProtocolIdOrRef,
    receipt_hash: validateHash,
    owner_completed_at: validateOwnerTimestamp,
    output_effect_hash: validateNullable(validateHash),
    failure_reason_code: validateNullable(validateReasonCode),
  });
  if (record.terminal_status === "succeeded" && record.output_effect_hash === null) {
    fail("invalid_scalar", `${path}.output_effect_hash`, "Succeeded execution requires an output/effect hash.");
  }
  if (record.terminal_status === "succeeded" && record.failure_reason_code !== null) {
    fail("invalid_scalar", `${path}.failure_reason_code`, "Succeeded execution forbids a failure reason.");
  }
  if (record.terminal_status === "failed" && record.failure_reason_code === null) {
    fail("invalid_scalar", `${path}.failure_reason_code`, "Failed execution requires a reason code.");
  }
  if (record.terminal_status === "cancelled" && record.output_effect_hash !== null) {
    fail("invalid_scalar", `${path}.output_effect_hash`, "Cancelled execution forbids an output/effect hash.");
  }
  if (record.terminal_status === "cancelled" && record.failure_reason_code === null) {
    fail("invalid_scalar", `${path}.failure_reason_code`, "Cancelled execution requires a reason code.");
  }
}

function validateExecutionLifecycle(value: unknown, path: string): void {
  validateExactObject(value, path, {
    owner_execution_id: validateProtocolIdOrRef,
    status: validateOneOf(["reserved", "dispatch_recorded", "started", "succeeded", "failed", "cancelled"]),
    observation_ref: validateProtocolIdOrRef,
    observation_hash: validateHash,
    owner_observed_at: validateOwnerTimestamp,
  });
}

function validateRequestOutcome(value: unknown, path: string): void {
  const kind = readDiscriminator(value, path, "kind");
  if (kind === "committed") {
    validateExactObject(value, path, {
      kind: validateLiteral(kind),
      receipt_ref: validateProtocolIdOrRef,
      authority_envelope_hash: validateHash,
    });
  } else if (kind === "pending" || kind === "not_found") {
    validateExactObject(value, path, { kind: validateLiteral(kind) });
  } else {
    fail("invalid_discriminator", `${path}.kind`, `Unknown request outcome: ${kind}.`);
  }
}

function validateReadObservationResultForOperation(value: unknown, path: string, operation: string): void {
  switch (operation) {
    case "describe_capability":
      validateCapabilityDescriptor(value, path);
      return;
    case "read_batch_snapshot":
      validateSnapshot(value, path);
      return;
    case "read_global_admission_snapshot":
      validateGlobalHead(value, path);
      return;
    case "read_batch_history_page":
      validateArray(validateHistoryItem, workflowBatchExecutionControlBoundsV1.max_page_size)(value, path);
      return;
    case "read_uniqueness_page":
      validateArray(validateUniquenessItem, workflowBatchExecutionControlBoundsV1.max_page_size)(value, path);
      return;
    case "read_execution_receipts_page":
      validateArray(validateExecutionReceipt, workflowBatchExecutionControlBoundsV1.max_page_size)(value, path);
      return;
    case "read_execution_lifecycle":
      validateArray(validateExecutionLifecycle, workflowBatchExecutionControlBoundsV1.max_page_size)(value, path);
      return;
    case "read_request_outcome":
      validateRequestOutcome(value, path);
      return;
    default:
      fail("invalid_discriminator", `${path}.operation`, `Unknown read observation operation: ${operation}.`);
  }
}

function validateReadObservation(value: unknown, path: string): void {
  const record = validateExactObject(value, path, {
    schema_version: validateSchemaVersion,
    observation_ref: validateProtocolIdOrRef,
    pins: validatePins,
    scope: validateScope,
    query_binding: validateQueryBinding,
    as_of_batch_head: validateNullable(validateBatchHead),
    as_of_global_head: validateGlobalHead,
    page: validateReadPageBinding,
    result: () => undefined,
    observed_at: validateOwnerTimestamp,
    read_observation_hash: validateHash,
  });
  const queryBinding = requireRecord(record.query_binding, `${path}.query_binding`);
  const operation = queryBinding.operation as string;
  validateObservationReadPolicyWindow(record, path);
  validateReadObservationResultForOperation(record.result, `${path}.result`, operation);
  const page = requireRecord(record.page, `${path}.page`);
  const expectsCollection = (readPageOperations as readonly string[]).includes(operation);
  if (expectsCollection) {
    if (page.kind !== "collection_page") fail("invalid_discriminator", `${path}.page.kind`, "Operation requires collection-page binding.");
    const result = record.result as unknown[];
    if (page.item_count !== result.length) {
      fail("invalid_scalar", `${path}.page.item_count`, "Page item count does not match result length.");
    }
  } else if (page.kind !== "singleton") {
    fail("invalid_discriminator", `${path}.page.kind`, "Operation requires singleton-page binding.");
  }

  if (operation === "describe_capability") {
    const descriptor = requireRecord(record.result, `${path}.result`);
    requireEqual(descriptor.pins, record.pins, `${path}.result.pins`, "Capability pins must match observation pins.");
  } else if (operation === "read_batch_snapshot") {
    const snapshot = requireRecord(record.result, `${path}.result`);
    if (record.as_of_batch_head === null) {
      fail("invalid_scalar", `${path}.as_of_batch_head`, "Batch snapshot observations require a batch head.");
    }
    requireEqual(snapshot.pins, record.pins, `${path}.result.pins`, "Snapshot pins must match observation pins.");
    requireEqual(snapshot.scope, record.scope, `${path}.result.scope`, "Snapshot scope must match observation scope.");
    requireEqual(
      snapshot.batch_head,
      record.as_of_batch_head,
      `${path}.result.batch_head`,
      "Snapshot batch head must equal the observation fixed head.",
    );
    requireEqual(
      snapshot.global_head,
      record.as_of_global_head,
      `${path}.result.global_head`,
      "Snapshot global head must equal the observation fixed head.",
    );
  } else if (operation === "read_global_admission_snapshot") {
    requireEqual(
      record.result,
      record.as_of_global_head,
      `${path}.result`,
      "Global admission result must equal the observation global head.",
    );
  } else if (
    operation === "read_batch_history_page" ||
    operation === "read_execution_receipts_page" ||
    operation === "read_execution_lifecycle"
  ) {
    if (record.as_of_batch_head === null) {
      fail("invalid_scalar", `${path}.as_of_batch_head`, `${operation} requires a batch head.`);
    }
    if (operation === "read_batch_history_page") {
      const batchHead = requireRecord(record.as_of_batch_head, `${path}.as_of_batch_head`);
      let previousEvent: JsonRecord | undefined;
      for (let index = 0; index < (record.result as unknown[]).length; index += 1) {
        const item = requireRecord((record.result as unknown[])[index], `${path}.result[${index}]`);
        const event = requireRecord(item.owner_event, `${path}.result[${index}].owner_event`);
        const stream = requireRecord(event.stream, `${path}.result[${index}].owner_event.stream`);
        const eventPath = `${path}.result[${index}].owner_event`;
        if (stream.owner_batch_id !== batchHead.owner_batch_id) {
          fail(
            "invalid_scalar",
            `${eventPath}.stream.owner_batch_id`,
            "History batch event must match the observation batch head.",
          );
        }
        const ledgerSequence = event.ledger_sequence as string;
        if (BigInt(ledgerSequence) > BigInt(batchHead.ledger_sequence as string)) {
          fail(
            "invalid_scalar",
            `${eventPath}.ledger_sequence`,
            "History event ledger sequence cannot exceed its fixed observation head.",
          );
        }
        if (ledgerSequence === batchHead.ledger_sequence && event.event_hash !== batchHead.last_event_hash) {
          fail(
            "invalid_scalar",
            `${eventPath}.event_hash`,
            "History event at the fixed head must equal the fixed head event hash.",
          );
        }
        if (previousEvent !== undefined) {
          const previousSequence = previousEvent.ledger_sequence as string;
          if (BigInt(ledgerSequence) <= BigInt(previousSequence)) {
            fail(
              "invalid_scalar",
              `${eventPath}.ledger_sequence`,
              "History events in the same stream must have strictly increasing ledger sequences.",
            );
          }
          if (
            BigInt(ledgerSequence) === BigInt(previousSequence) + 1n &&
            event.previous_event_hash !== previousEvent.event_hash
          ) {
            fail(
              "invalid_scalar",
              `${eventPath}.previous_event_hash`,
              "Adjacent history events must preserve the previous event hash chain.",
            );
          }
        }
        previousEvent = event;
      }
    }
  }

  if (operation === "read_batch_snapshot") {
    requireSnapshotFactsNoLaterThan(
      requireRecord(record.result, `${path}.result`),
      record.observed_at,
      `${path}.result`,
    );
  } else if (operation === "read_batch_history_page") {
    for (let index = 0; index < (record.result as unknown[]).length; index += 1) {
      const item = requireRecord((record.result as unknown[])[index], `${path}.result[${index}]`);
      const event = requireRecord(item.owner_event, `${path}.result[${index}].owner_event`);
      requireTimestampAtOrAfter(
        record.observed_at,
        event.owner_event_at,
        `${path}.result[${index}].owner_event.owner_event_at`,
        "Read observation cannot predate a returned history event.",
      );
    }
  } else if (operation === "read_execution_receipts_page") {
    for (let index = 0; index < (record.result as unknown[]).length; index += 1) {
      const item = requireRecord((record.result as unknown[])[index], `${path}.result[${index}]`);
      requireTimestampAtOrAfter(
        record.observed_at,
        item.owner_completed_at,
        `${path}.result[${index}].owner_completed_at`,
        "Read observation cannot predate a returned execution receipt.",
      );
    }
  } else if (operation === "read_execution_lifecycle") {
    for (let index = 0; index < (record.result as unknown[]).length; index += 1) {
      const item = requireRecord((record.result as unknown[])[index], `${path}.result[${index}]`);
      requireTimestampAtOrAfter(
        record.observed_at,
        item.owner_observed_at,
        `${path}.result[${index}].owner_observed_at`,
        "Read observation cannot predate a returned execution lifecycle fact.",
      );
    }
  }
}

function canonicalizeProtocolJson(value: unknown, path = "$", depth = 1): string {
  if (depth > workflowBatchExecutionControlBoundsV1.max_json_depth) {
    fail("maximum_depth_exceeded", path, "Canonical JSON exceeds the protocol depth limit.");
  }
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) {
      fail("invalid_scalar", path, "Canonical protocol JSON permits only safe integers.");
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value
      .map((item, index) => canonicalizeProtocolJson(item, `${path}[${index}]`, depth + 1))
      .join(",")}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${canonicalizeProtocolJson(
            value[key],
            appendObjectPath(path, key),
            depth + 1,
          )}`,
      )
      .join(",")}}`;
  }
  fail("invalid_type", path, "Value is not canonical protocol JSON.");
}

function sha256Hex(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function domainSeparatedProjectionHash(prefix: string, projection: unknown): string {
  const canonicalProjection = canonicalizeProtocolJson(projection);
  return sha256Hex(
    Buffer.concat([
      Buffer.from(prefix, "utf8"),
      Buffer.from(canonicalProjection, "utf8"),
    ]),
  );
}

function authorityEnvelopeDomainHash(value: unknown): string {
  return domainSeparatedProjectionHash(
    workflowBatchExecutionControlAuthorityEnvelopeDomainPrefixV1,
    buildAuthorityEnvelopeHashProjection(value),
  );
}

function validateProjectedHash(
  actual: unknown,
  prefix: string,
  projection: unknown,
  path: string,
  description: string,
): void {
  const expected = domainSeparatedProjectionHash(prefix, projection);
  if (actual !== expected) {
    fail("invalid_hash_projection", path, `${description} does not match its domain-separated projection hash.`);
  }
}

function validateCanonicalEnvelopeUtf8(value: unknown, path: string): void {
  if (typeof value !== "string" || !asciiPattern.test(value)) {
    fail("invalid_scalar", path, "Canonical envelope bytes must be an ASCII JSON string.");
  }
  if (Buffer.byteLength(value, "utf8") > workflowBatchExecutionControlBoundsV1.max_canonical_envelope_bytes) {
    fail("limit_exceeded", path, "Canonical envelope exceeds the canonical-envelope byte limit.");
  }
}

function validateResolverInput(value: unknown, path: string): void {
  validateExactObject(value, path, {
    receipt_ref: validateProtocolIdOrRef,
    expected_pins: validatePins,
  });
}

function validateAuthorityReceipt(value: unknown, path: string): void {
  const record = validateExactObject(value, path, {
    receipt_ref: validateProtocolIdOrRef,
    authority_envelope: validateAuthorityEnvelope,
    canonical_envelope_utf8: validateCanonicalEnvelopeUtf8,
    authority_envelope_hash: validateHash,
    canonical_envelope_bytes_sha256: validateHash,
  });
  const envelope = requireRecord(record.authority_envelope, `${path}.authority_envelope`);
  requireEqual(
    record.receipt_ref,
    envelope.receipt_ref,
    `${path}.receipt_ref`,
    "Receipt wrapper and authority-envelope receipt refs must match.",
  );
  requireEqual(
    record.authority_envelope_hash,
    envelope.authority_envelope_hash,
    `${path}.authority_envelope_hash`,
    "Receipt wrapper and embedded authority-envelope hashes must match.",
  );
  const calculatedAuthorityHash = authorityEnvelopeDomainHash(envelope);
  if (envelope.authority_envelope_hash !== calculatedAuthorityHash) {
    fail(
      "invalid_hash_projection",
      `${path}.authority_envelope.authority_envelope_hash`,
      "Embedded authority-envelope hash does not match its domain-separated projection hash.",
    );
  }
  const canonicalEnvelope = canonicalizeProtocolJson(envelope);
  requireEqual(
    record.canonical_envelope_utf8,
    canonicalEnvelope,
    `${path}.canonical_envelope_utf8`,
    "Canonical envelope bytes must be the exact JCS serialization of the full embedded envelope.",
  );
  const rawBytesHash = sha256Hex(Buffer.from(record.canonical_envelope_utf8 as string, "utf8"));
  requireEqual(
    record.canonical_envelope_bytes_sha256,
    rawBytesHash,
    `${path}.canonical_envelope_bytes_sha256`,
    "Canonical-envelope raw byte hash mismatch.",
  );
}

const requestOperationToBatchEventType: Readonly<Record<string, string>> = {
  open_or_resume_batch: "batch_opened",
  claim_batch: "batch_claimed",
  renew_batch_claim: "batch_claim_renewed",
  release_batch_claim: "batch_claim_released",
  reserve_executions: "executions_reserved",
  seal_execution_manifest: "execution_manifest_sealed",
  confirm_client_commit: "client_commit_confirmed",
  dispatch_batch: "dispatch_recorded",
  quarantine_reservation: "reservation_quarantined",
  reconcile_batch: "batch_reconciled",
};

function validateRequestProjectedHash(value: unknown, path: string, description: string): void {
  const record = requireRecord(value, path);
  const requestMeta = requireRecord(record.request_meta, `${path}.request_meta`);
  validateProjectedHash(
    requestMeta.request_hash,
    workflowBatchExecutionControlRequestDomainPrefixV1,
    buildRequestHashProjection(value),
    `${path}.request_meta.request_hash`,
    description,
  );
}

function validateObservationProjectedHash(value: unknown, path: string): void {
  const record = requireRecord(value, path);
  validateProjectedHash(
    record.read_observation_hash,
    workflowBatchExecutionControlReadObservationDomainPrefixV1,
    buildReadObservationHashProjection(value),
    `${path}.read_observation_hash`,
    "Read-observation hash",
  );
}

const snapshotTransitionFactKeys = [
  "claim",
  "reservation",
  "seal",
  "client_commit",
  "client_commit_status",
  "dispatch",
  "dispatch_effect_status",
  "completion_status",
  "recovery",
  "tombstone",
  "reconciliation",
] as const;

function requirePreservedSnapshotFacts(
  before: JsonRecord,
  after: JsonRecord,
  mutableKeys: ReadonlySet<string>,
  path: string,
): void {
  for (const key of snapshotTransitionFactKeys) {
    if (mutableKeys.has(key)) continue;
    requireEqual(
      after[key],
      before[key],
      `${path}.${key}`,
      `Authority transition must preserve the existing ${key} fact exactly.`,
    );
  }
}

function normalizedClientCommit(snapshot: JsonRecord, path: string): JsonRecord | null {
  if (Object.hasOwn(snapshot, "client_commit")) {
    return {
      kind: "confirmed",
      ...requireRecord(snapshot.client_commit, `${path}.client_commit`),
    };
  }
  if (Object.hasOwn(snapshot, "client_commit_status")) {
    return requireRecord(snapshot.client_commit_status, `${path}.client_commit_status`);
  }
  return null;
}

function requirePreservedClientCommit(
  before: JsonRecord,
  after: JsonRecord,
  path: string,
  allowNewNotConfirmed: boolean,
): void {
  const beforeCommit = normalizedClientCommit(before, "$.before_observation.result");
  const afterCommit = normalizedClientCommit(after, path);
  if (
    beforeCommit === null &&
    allowNewNotConfirmed &&
    afterCommit !== null &&
    afterCommit.kind === "not_confirmed"
  ) {
    return;
  }
  requireEqual(
    afterCommit,
    beforeCommit,
    Object.hasOwn(after, "client_commit_status")
      ? `${path}.client_commit_status`
      : `${path}.client_commit`,
    "Authority transition must preserve the existing client-commit fact exactly.",
  );
}

function requireClaimKind(
  snapshot: JsonRecord,
  expected: "none" | "present",
  path: string,
): JsonRecord {
  const claim = requireRecord(snapshot.claim, `${path}.claim`);
  const matches = expected === "none" ? claim.kind === "none" : claim.kind !== "none";
  if (!matches) {
    fail(
      "invalid_scalar",
      `${path}.claim.kind`,
      `Authority transition requires a ${expected === "none" ? "cleared" : "present"} claim.`,
    );
  }
  return claim;
}

function validateAuthoritySnapshotTransition(
  eventType: string,
  eventAt: string,
  before: JsonRecord,
  after: JsonRecord,
  path: string,
): void {
  requireEqual(
    after.binding,
    before.binding,
    `${path}.binding`,
    "Authority transition must preserve the immutable batch binding exactly.",
  );
  requireEqual(
    after.logical_units,
    before.logical_units,
    `${path}.logical_units`,
    "Authority transition must preserve the logical-unit collection exactly.",
  );

  switch (eventType) {
    case "batch_claimed": {
      requirePreservedSnapshotFacts(before, after, new Set(["claim"]), path);
      requireClaimKind(before, "none", "$.before_observation.result");
      requireClaimKind(after, "present", path);
      return;
    }
    case "batch_claim_renewed": {
      requirePreservedSnapshotFacts(before, after, new Set(["claim"]), path);
      const beforeClaim = requireClaimKind(before, "present", "$.before_observation.result");
      const afterClaim = requireClaimKind(after, "present", path);
      requirePreservedClaimAuthority(beforeClaim, afterClaim, `${path}.claim`);
      if ((afterClaim.owner_issued_at as string) < (beforeClaim.owner_issued_at as string)) {
        fail(
          "invalid_scalar",
          `${path}.claim.owner_issued_at`,
          "Renewed claim issuance cannot move backwards.",
        );
      }
      if ((afterClaim.lease_expires_at as string) <= (beforeClaim.lease_expires_at as string)) {
        fail(
          "invalid_scalar",
          `${path}.claim.lease_expires_at`,
          "Renewed claim expiry must strictly increase from the prior readback.",
        );
      }
      return;
    }
    case "batch_claim_released":
    case "claim_expired": {
      requirePreservedSnapshotFacts(
        before,
        after,
        new Set(["claim", "recovery", "client_commit", "client_commit_status"]),
        path,
      );
      const beforeClaim = requireClaimKind(before, "present", "$.before_observation.result");
      requireClaimKind(after, "none", path);
      if (eventType === "claim_expired" && eventAt < (beforeClaim.lease_expires_at as string)) {
        fail(
          "invalid_scalar",
          "$.receipt.authority_envelope.batch_event.owner_event_at",
          "Claim-expiry event time must be at or after the prior readback lease expiry.",
        );
      }
      if (Object.hasOwn(before, "recovery")) {
        requireEqual(
          after.recovery,
          before.recovery,
          `${path}.recovery`,
          "Claim release/expiry must preserve an existing recovery fact exactly.",
        );
      }
      requirePreservedClientCommit(before, after, path, !Object.hasOwn(before, "recovery"));
      return;
    }
    case "executions_reserved":
      requirePreservedSnapshotFacts(before, after, new Set(["reservation"]), path);
      if (Object.hasOwn(before, "reservation") || !Object.hasOwn(after, "reservation")) {
        fail(
          "invalid_scalar",
          `${path}.reservation`,
          "Reservation transition must add exactly the first reservation fact.",
        );
      }
      return;
    case "execution_manifest_sealed":
      requirePreservedSnapshotFacts(before, after, new Set(["seal"]), path);
      if (Object.hasOwn(before, "seal") || !Object.hasOwn(after, "seal")) {
        fail("invalid_scalar", `${path}.seal`, "Seal transition must add exactly the first seal fact.");
      }
      return;
    case "client_commit_confirmed": {
      requirePreservedSnapshotFacts(
        before,
        after,
        new Set(["client_commit", "client_commit_status"]),
        path,
      );
      const beforeCommit = normalizedClientCommit(before, "$.before_observation.result");
      const afterCommit = normalizedClientCommit(after, path);
      if (
        (beforeCommit !== null && beforeCommit.kind !== "not_confirmed") ||
        afterCommit === null ||
        afterCommit.kind !== "confirmed"
      ) {
        fail(
          "invalid_scalar",
          Object.hasOwn(after, "client_commit_status")
            ? `${path}.client_commit_status.kind`
            : `${path}.client_commit`,
          "Client-commit transition must advance absent/not-confirmed to confirmed exactly once.",
        );
      }
      return;
    }
    case "dispatch_recorded": {
      requirePreservedSnapshotFacts(
        before,
        after,
        new Set([
          "client_commit",
          "client_commit_status",
          "dispatch",
          "dispatch_effect_status",
          "completion_status",
        ]),
        path,
      );
      requirePreservedClientCommit(before, after, path, false);
      if (Object.hasOwn(before, "dispatch") || !Object.hasOwn(after, "dispatch")) {
        fail("invalid_scalar", `${path}.dispatch`, "Dispatch transition must add exactly the first dispatch fact.");
      }
      const effect = requireRecord(after.dispatch_effect_status, `${path}.dispatch_effect_status`);
      const completion = requireRecord(after.completion_status, `${path}.completion_status`);
      if (effect.kind !== "recorded" || completion.kind !== "none") {
        fail(
          "invalid_scalar",
          `${path}.dispatch_effect_status.kind`,
          "Dispatch transition must start at recorded effect with no completion.",
        );
      }
      return;
    }
    case "dispatch_effect_started": {
      requirePreservedSnapshotFacts(before, after, new Set(["dispatch_effect_status"]), path);
      const beforeEffect = requireRecord(
        before.dispatch_effect_status,
        "$.before_observation.result.dispatch_effect_status",
      );
      const afterEffect = requireRecord(after.dispatch_effect_status, `${path}.dispatch_effect_status`);
      if (beforeEffect.kind !== "recorded" || afterEffect.kind !== "started") {
        fail(
          "invalid_scalar",
          `${path}.dispatch_effect_status.kind`,
          "Dispatch-effect transition must advance recorded to started exactly once.",
        );
      }
      return;
    }
    case "execution_completion_recorded": {
      requirePreservedSnapshotFacts(before, after, new Set(["claim", "completion_status"]), path);
      const beforeCompletion = requireRecord(
        before.completion_status,
        "$.before_observation.result.completion_status",
      );
      const afterCompletion = requireRecord(after.completion_status, `${path}.completion_status`);
      if (
        !["none", "partial"].includes(beforeCompletion.kind as string) ||
        !["partial", "all_terminal"].includes(afterCompletion.kind as string) ||
        (afterCompletion.receipt_count as number) !== (beforeCompletion.receipt_count as number) + 1
      ) {
        fail(
          "invalid_scalar",
          `${path}.completion_status.receipt_count`,
          "Each completion event must append exactly one receipt to a non-terminal prior status.",
        );
      }
      requireEqual(
        afterCompletion.expected_count,
        beforeCompletion.expected_count,
        `${path}.completion_status.expected_count`,
        "Completion progress must preserve the expected execution count.",
      );
      if (afterCompletion.collection_root === beforeCompletion.collection_root) {
        fail(
          "invalid_scalar",
          `${path}.completion_status.collection_root`,
          "Appending a completion receipt must change the completion collection root.",
        );
      }
      if (afterCompletion.kind === "all_terminal" && typeof afterCompletion.lifecycle_head !== "string") {
        fail(
          "invalid_scalar",
          `${path}.completion_status.lifecycle_head`,
          "All-terminal completion must publish its lifecycle head.",
        );
      }
      const afterClaim = requireRecord(after.claim, `${path}.claim`);
      if (after.state === "completed") {
        requireClaimKind(before, "present", "$.before_observation.result");
        requireClaimKind(after, "none", path);
      } else {
        requireEqual(
          afterClaim,
          requireRecord(before.claim, "$.before_observation.result.claim"),
          `${path}.claim`,
          "Non-terminal completion progress must preserve the current claim exactly.",
        );
      }
      return;
    }
    case "reservation_quarantined":
    case "batch_reconciled": {
      const terminalFact = eventType === "reservation_quarantined" ? "tombstone" : "reconciliation";
      requirePreservedSnapshotFacts(before, after, new Set(["claim", terminalFact]), path);
      requireClaimKind(before, "present", "$.before_observation.result");
      requireClaimKind(after, "none", path);
      if (Object.hasOwn(before, terminalFact) || !Object.hasOwn(after, terminalFact)) {
        fail(
          "invalid_scalar",
          `${path}.${terminalFact}`,
          `${eventType} must add exactly the first ${terminalFact} fact.`,
        );
      }
      return;
    }
    default:
      fail(
        "invalid_discriminator",
        "$.receipt.authority_envelope.batch_event.event_type",
        `Unsupported authority transition event: ${eventType}.`,
      );
  }
}

function expectedClientCommandCausation(requestMeta: JsonRecord): JsonRecord {
  return {
    kind: "client_command",
    command_id: requestMeta.command_id,
    idempotency_key: requestMeta.idempotency_key,
    request_hash: requestMeta.request_hash,
  };
}

function requireLeaseTtl(
  claim: JsonRecord,
  requestedTtlSeconds: unknown,
  path: string,
): void {
  const issuedAt = Date.parse(claim.owner_issued_at as string);
  const expiresAt = Date.parse(claim.lease_expires_at as string);
  if (
    typeof requestedTtlSeconds !== "number" ||
    !Number.isSafeInteger(requestedTtlSeconds) ||
    expiresAt - issuedAt !== requestedTtlSeconds * 1_000
  ) {
    fail(
      "invalid_scalar",
      `${path}.lease_expires_at`,
      "Result claim lease duration must exactly equal the requested TTL.",
    );
  }
}

function requireClaimInsidePolicyWindow(
  request: JsonRecord,
  claim: JsonRecord,
  path: string,
): void {
  const policy = requireRecord(request.policy_decision, "$.request.policy_decision");
  if ((claim.owner_issued_at as string) < (policy.not_before as string)) {
    fail(
      "invalid_scalar",
      `${path}.owner_issued_at`,
      "Result claim issuance cannot precede the request policy window.",
    );
  }
  if ((claim.lease_expires_at as string) > (policy.expires_at as string)) {
    fail(
      "invalid_scalar",
      `${path}.lease_expires_at`,
      "Result claim lease cannot outlive the request policy window.",
    );
  }
}

function requirePreservedClaimAuthority(
  currentClaim: JsonRecord,
  resultClaim: JsonRecord,
  path: string,
): void {
  for (const key of ["kind", "claim_id", "lease_id", "fence"] as const) {
    requireEqual(
      resultClaim[key],
      currentClaim[key],
      `${path}.${key}`,
      `Renewed claim must preserve ${key}.`,
    );
  }
  if (currentClaim.kind === "reconciliation_only") {
    for (const key of [
      "original_identity_collection_hash",
      "allowed_operations",
      "allowed_operations_hash",
      "recovery_policy",
    ] as const) {
      requireEqual(
        resultClaim[key],
        currentClaim[key],
        `${path}.${key}`,
        `Renewed reconciliation claim must preserve ${key}.`,
      );
    }
  }
}

function requireRecoveryIdentityForClaim(
  currentClaim: JsonRecord,
  snapshot: JsonRecord,
  path: string,
  includeReconciliation: boolean,
): void {
  if (currentClaim.kind !== "reconciliation_only") return;
  const expectedIdentity = currentClaim.original_identity_collection_hash;
  for (const containerKey of ["reservation", "recovery"] as const) {
    const container = requireRecord(snapshot[containerKey], `${path}.${containerKey}`);
    requireEqual(
      container.identity_collection_hash ?? container.original_identity_collection_hash,
      expectedIdentity,
      `${path}.${containerKey}.${
        containerKey === "reservation" ? "identity_collection_hash" : "original_identity_collection_hash"
      }`,
      "Recovery result must preserve the reconciliation claim identity collection.",
    );
  }
  if (includeReconciliation) {
    const reconciliation = requireRecord(snapshot.reconciliation, `${path}.reconciliation`);
    requireEqual(
      reconciliation.original_identity_collection_hash,
      expectedIdentity,
      `${path}.reconciliation.original_identity_collection_hash`,
      "Reconciliation result must preserve the reconciliation claim identity collection.",
    );
  }
}

function validateAuthorityResultForMutation(
  request: JsonRecord,
  snapshot: JsonRecord,
  path: string,
): void {
  const payload = requireRecord(request.payload, "$.request.payload");
  switch (request.operation) {
    case "claim_batch": {
      const resultClaim = requireRecord(snapshot.claim, `${path}.claim`);
      requireEqual(
        resultClaim.kind,
        payload.claim_type,
        `${path}.claim.kind`,
        "Claim result kind must equal the requested claim type.",
      );
      requireLeaseTtl(resultClaim, payload.requested_ttl_seconds, `${path}.claim`);
      requireClaimInsidePolicyWindow(request, resultClaim, `${path}.claim`);
      if (payload.claim_type === "reconciliation_only") {
        requireEqual(
          resultClaim.original_identity_collection_hash,
          payload.original_identity_collection_hash,
          `${path}.claim.original_identity_collection_hash`,
          "Reconciliation claim must preserve the requested identity collection.",
        );
        requireEqual(
          resultClaim.recovery_policy,
          request.policy_decision,
          `${path}.claim.recovery_policy`,
          "Reconciliation claim must preserve the request recovery policy decision.",
        );
        const requestedOperations = new Set(payload.requested_operations as string[]);
        for (const operation of resultClaim.allowed_operations as string[]) {
          if (!requestedOperations.has(operation)) {
            fail(
              "invalid_scalar",
              `${path}.claim.allowed_operations`,
              "Reconciliation claim allowed operations must be a subset of the requested operations.",
            );
          }
        }
      }
      return;
    }
    case "renew_batch_claim": {
      const currentClaim = requireRecord(request.current_claim, "$.request.current_claim");
      const resultClaim = requireRecord(snapshot.claim, `${path}.claim`);
      requirePreservedClaimAuthority(currentClaim, resultClaim, `${path}.claim`);
      requireLeaseTtl(resultClaim, payload.requested_ttl_seconds, `${path}.claim`);
      requireClaimInsidePolicyWindow(request, resultClaim, `${path}.claim`);
      return;
    }
    case "release_batch_claim":
      requireEqual(
        requireRecord(snapshot.claim, `${path}.claim`).kind,
        "none",
        `${path}.claim.kind`,
        "Released claim result must have no claim.",
      );
      requireRecoveryIdentityForClaim(
        requireRecord(request.current_claim, "$.request.current_claim"),
        snapshot,
        path,
        false,
      );
      return;
    case "reserve_executions":
      requireEqual(
        snapshot.claim,
        request.current_claim,
        `${path}.claim`,
        "Reservation result must preserve the exact current claim authority.",
      );
      requireEqual(
        requireRecord(snapshot.reservation, `${path}.reservation`).logical_unit_collection_root,
        payload.logical_unit_collection_root,
        `${path}.reservation.logical_unit_collection_root`,
        "Reservation must preserve the requested logical-unit collection root.",
      );
      return;
    case "seal_execution_manifest": {
      requireEqual(
        snapshot.claim,
        request.current_claim,
        `${path}.claim`,
        "Seal result must preserve the exact current claim authority.",
      );
      const seal = requireRecord(snapshot.seal, `${path}.seal`);
      requireEqual(
        seal.reservation_hash,
        payload.reservation_hash,
        `${path}.seal.reservation_hash`,
        "Seal must preserve the requested reservation hash.",
      );
      requireEqual(
        seal.execution_manifest_hash,
        payload.execution_manifest_hash,
        `${path}.seal.execution_manifest_hash`,
        "Seal must preserve the requested execution manifest hash.",
      );
      return;
    }
    case "confirm_client_commit": {
      requireEqual(
        snapshot.claim,
        request.current_claim,
        `${path}.claim`,
        "Client-commit result must preserve the exact current claim authority.",
      );
      const seal = requireRecord(snapshot.seal, `${path}.seal`);
      const commit = Object.hasOwn(snapshot, "client_commit")
        ? requireRecord(snapshot.client_commit, `${path}.client_commit`)
        : requireRecord(snapshot.client_commit_status, `${path}.client_commit_status`);
      requireEqual(seal.seal_hash, payload.seal_hash, `${path}.seal.seal_hash`, "Client commit must identify the requested seal.");
      for (const key of ["execution_manifest_hash", "client_commit_ref", "client_commit_hash"] as const) {
        requireEqual(
          commit[key],
          payload[key],
          `${path}.${Object.hasOwn(snapshot, "client_commit") ? "client_commit" : "client_commit_status"}.${key}`,
          `Client commit result must preserve ${key}.`,
        );
      }
      return;
    }
    case "dispatch_batch": {
      requireEqual(
        snapshot.claim,
        request.current_claim,
        `${path}.claim`,
        "Dispatch result must preserve the exact current claim authority.",
      );
      const dispatch = requireRecord(snapshot.dispatch, `${path}.dispatch`);
      for (const key of ["seal_hash", "client_commit_hash", "execution_manifest_hash"] as const) {
        requireEqual(
          dispatch[key],
          payload[key],
          `${path}.dispatch.${key}`,
          `Dispatch result must preserve ${key}.`,
        );
      }
      return;
    }
    case "quarantine_reservation": {
      const tombstone = requireRecord(snapshot.tombstone, `${path}.tombstone`);
      for (const [payloadKey, tombstoneKey] of [
        ["reservation_hash", "reservation_hash"],
        ["original_identity_collection_hash", "original_identity_collection_hash"],
        ["reason_code", "reason_code"],
      ] as const) {
        requireEqual(
          tombstone[tombstoneKey],
          payload[payloadKey],
          `${path}.tombstone.${tombstoneKey}`,
          `Quarantine result must preserve ${payloadKey}.`,
        );
      }
      return;
    }
    case "reconcile_batch": {
      requireRecoveryIdentityForClaim(
        requireRecord(request.current_claim, "$.request.current_claim"),
        snapshot,
        path,
        true,
      );
      const reconciliation = requireRecord(snapshot.reconciliation, `${path}.reconciliation`);
      requireEqual(
        reconciliation.outcome,
        payload.outcome,
        `${path}.reconciliation.outcome`,
        "Reconciliation result outcome must equal the requested outcome.",
      );
      requireEqual(
        reconciliation.completion_collection_root,
        payload.expected_completion_collection_root,
        `${path}.reconciliation.completion_collection_root`,
        "Reconciliation result must preserve the expected completion collection root.",
      );
      requireEqual(
        reconciliation.lifecycle_head,
        payload.expected_lifecycle_head,
        `${path}.reconciliation.lifecycle_head`,
        "Reconciliation result must preserve the expected lifecycle head.",
      );
      requireEqual(
        reconciliation.reason_code,
        payload.reason_code,
        `${path}.reconciliation.reason_code`,
        "Reconciliation result must preserve the requested reason code.",
      );
      return;
    }
  }
}

function validateRequestAuthorityAtCommit(
  request: JsonRecord,
  batchEvent: JsonRecord,
  path: string,
): void {
  const eventAt = batchEvent.owner_event_at as string;
  const policy = requireRecord(request.policy_decision, "$.request.policy_decision");
  if (eventAt < (policy.not_before as string) || eventAt >= (policy.expires_at as string)) {
    fail(
      "invalid_scalar",
      `${path}.batch_event.owner_event_at`,
      "Authority receipt commit time must be inside the request policy window.",
    );
  }
  if (Object.hasOwn(request, "current_claim")) {
    const claim = requireRecord(request.current_claim, "$.request.current_claim");
    if (eventAt < (claim.owner_issued_at as string) || eventAt >= (claim.lease_expires_at as string)) {
      fail(
        "invalid_scalar",
        `${path}.batch_event.owner_event_at`,
        "Authority receipt commit time must be inside the current claim lease window.",
      );
    }
  }
}

function validateResultClaimAtCommit(
  request: JsonRecord,
  snapshot: JsonRecord,
  batchEvent: JsonRecord,
  path: string,
): void {
  if (request.operation !== "claim_batch" && request.operation !== "renew_batch_claim") return;
  const resultClaim = requireRecord(snapshot.claim, `${path}.claim`);
  const eventAt = batchEvent.owner_event_at as string;
  if (
    eventAt < (resultClaim.owner_issued_at as string) ||
    eventAt >= (resultClaim.lease_expires_at as string)
  ) {
    fail(
      "invalid_scalar",
      `${path}.claim.lease_expires_at`,
      "Result claim lease must be active at the authority receipt commit time.",
    );
  }
  if (request.operation === "renew_batch_claim") {
    const currentClaim = requireRecord(request.current_claim, "$.request.current_claim");
    if ((resultClaim.lease_expires_at as string) <= (currentClaim.lease_expires_at as string)) {
      fail(
        "invalid_scalar",
        `${path}.claim.lease_expires_at`,
        "Renewed claim lease expiry must strictly extend the current claim lease.",
      );
    }
  }
}

function validateObservationReadPolicyWindow(observation: JsonRecord, path: string): void {
  const query = requireRecord(observation.query_binding, `${path}.query_binding`);
  const policy = requireRecord(query.read_policy, `${path}.query_binding.read_policy`);
  const observedAt = observation.observed_at as string;
  if (observedAt < (policy.not_before as string) || observedAt >= (policy.expires_at as string)) {
    fail(
      "invalid_scalar",
      `${path}.observed_at`,
      "Read observation time must be inside the query read-policy window.",
    );
  }
}

function validateResolvedEnvelope(value: unknown, path: string): void {
  validateAuthorityReceipt(value, path);
}

function cloneJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cloneJsonValue);
  if (!isRecord(value)) return value;
  const clone: JsonRecord = Object.create(null) as JsonRecord;
  for (const [key, nestedValue] of Object.entries(value)) clone[key] = cloneJsonValue(nestedValue);
  return clone;
}

function omitClonedKey(value: unknown, key: string, path: string): JsonRecord {
  const clone = requireRecord(cloneJsonValue(value), path);
  delete clone[key];
  return clone;
}

function buildRequestHashProjection(value: unknown): JsonRecord {
  const record = requireRecord(value, "$");
  if (Object.hasOwn(record, "kind")) {
    if (record.kind !== "create_if_absent") {
      fail("invalid_hash_projection", "$.kind", "Only create requests have mutation request-hash projections.");
    }
    validateCreateOpenInput(value, "$");
  } else {
    validateMutationCommand(value, "$");
  }
  const projection = requireRecord(cloneJsonValue(value), "$");
  projection.request_meta = omitClonedKey(projection.request_meta, "request_hash", "$.request_meta");
  if (Object.hasOwn(requireRecord(projection.request_meta, "$.request_meta"), "request_hash")) {
    fail("invalid_hash_projection", "$.request_meta.request_hash", "Request projection must exclude request_hash.");
  }
  return projection;
}

function buildAuthorityEnvelopeHashProjection(value: unknown): JsonRecord {
  validateAuthorityEnvelope(value, "$");
  const projection = omitClonedKey(value, "authority_envelope_hash", "$");
  if (Object.hasOwn(projection, "authority_envelope_hash")) {
    fail("invalid_hash_projection", "$.authority_envelope_hash", "Authority projection must exclude its output hash.");
  }
  return projection;
}

function buildReadObservationHashProjection(value: unknown): JsonRecord {
  validateReadObservation(value, "$");
  const projection = omitClonedKey(value, "read_observation_hash", "$");
  if (Object.hasOwn(projection, "read_observation_hash")) {
    fail("invalid_hash_projection", "$.read_observation_hash", "Read projection must exclude its output hash.");
  }
  return projection;
}

function projectionResult(builder: () => unknown): WorkflowBatchExecutionControlDecodeResultV1 {
  try {
    return { ok: true, value: builder() };
  } catch (error) {
    if (error instanceof DecodeFailure) return { ok: false, findings: [error.finding] };
    return {
      ok: false,
      findings: [{ code: "invalid_hash_projection", path: "$", message: "Unable to construct hash projection." }],
    };
  }
}

export function createWorkflowBatchExecutionControlRequestHashProjectionV1(
  value: unknown,
): WorkflowBatchExecutionControlDecodeResultV1 {
  return projectionResult(() => buildRequestHashProjection(value));
}

export function createWorkflowBatchExecutionControlAuthorityEnvelopeHashProjectionV1(
  value: unknown,
): WorkflowBatchExecutionControlDecodeResultV1 {
  return projectionResult(() => buildAuthorityEnvelopeHashProjection(value));
}

export function createWorkflowBatchExecutionControlReadObservationHashProjectionV1(
  value: unknown,
): WorkflowBatchExecutionControlDecodeResultV1 {
  return projectionResult(() => buildReadObservationHashProjection(value));
}

export function verifyWorkflowBatchExecutionControlAuthorityReceiptV1(
  request: unknown,
  receipt: unknown,
): WorkflowBatchExecutionControlDecodeResultV1 {
  return projectionResult(() => {
    const requestRecord = requireRecord(request, "$.request");
    const isCreate = Object.hasOwn(requestRecord, "kind");
    if (isCreate) {
      if (requestRecord.kind !== "create_if_absent") {
        fail(
          "invalid_discriminator",
          "$.request.kind",
          "Authority receipts can be paired only with create_if_absent or mutation requests.",
        );
      }
      validateCreateOpenInput(request, "$.request");
      validateRequestProjectedHash(request, "$.request", "Create request hash");
    } else {
      validateMutationCommand(request, "$.request");
      validateRequestProjectedHash(request, "$.request", "Mutation request hash");
    }
    validateAuthorityReceipt(receipt, "$.receipt");

    const receiptRecord = requireRecord(receipt, "$.receipt");
    const envelope = requireRecord(receiptRecord.authority_envelope, "$.receipt.authority_envelope");
    const requestMeta = requireRecord(requestRecord.request_meta, "$.request.request_meta");
    const precondition = requireRecord(requestRecord.precondition, "$.request.precondition");
    const snapshot = requireRecord(envelope.result_snapshot, "$.receipt.authority_envelope.result_snapshot");
    const snapshotBinding = requireRecord(snapshot.binding, "$.receipt.authority_envelope.result_snapshot.binding");
    const batchEvent = requireRecord(envelope.batch_event, "$.receipt.authority_envelope.batch_event");

    validateRequestAuthorityAtCommit(requestRecord, batchEvent, "$.receipt.authority_envelope");

    requireEqual(
      envelope.pins,
      requestRecord.pins,
      "$.receipt.authority_envelope.pins",
      "Authority receipt pins must exactly equal the request pins.",
    );
    requireEqual(
      envelope.scope,
      requestRecord.scope,
      "$.receipt.authority_envelope.scope",
      "Authority receipt scope must exactly equal the request scope.",
    );
    requireEqual(
      envelope.causation,
      expectedClientCommandCausation(requestMeta),
      "$.receipt.authority_envelope.causation",
      "Authority receipt causation must exactly bind the request command, idempotency key, and request hash.",
    );
    requireEqual(
      envelope.before_global_head,
      precondition.expected_global_head,
      "$.receipt.authority_envelope.before_global_head",
      "Authority receipt before-global head must exactly equal the request precondition.",
    );

    const expectedEventType = requestOperationToBatchEventType[requestRecord.operation as string];
    if (batchEvent.event_type !== expectedEventType) {
      fail(
        "invalid_scalar",
        "$.receipt.authority_envelope.batch_event.event_type",
        `Request operation ${String(requestRecord.operation)} requires batch event ${String(expectedEventType)}.`,
      );
    }

    if (isCreate) {
      if (envelope.before_batch_head !== null) {
        fail(
          "invalid_scalar",
          "$.receipt.authority_envelope.before_batch_head",
          "A create_if_absent receipt requires an absent before-batch head.",
        );
      }
      const openBinding = requireRecord(requestRecord.binding, "$.request.binding");
      const expectedBinding = requireRecord(cloneJsonValue(openBinding), "$.request.binding");
      const expectedLogicalUnits = expectedBinding.logical_units;
      delete expectedBinding.logical_units;
      const actualBinding = requireRecord(cloneJsonValue(snapshotBinding), "$.receipt.authority_envelope.result_snapshot.binding");
      delete actualBinding.owner_batch_id;
      requireEqual(
        actualBinding,
        expectedBinding,
        "$.receipt.authority_envelope.result_snapshot.binding",
        "Created snapshot binding must exactly preserve every client binding field.",
      );
      requireEqual(
        snapshot.logical_units,
        expectedLogicalUnits,
        "$.receipt.authority_envelope.result_snapshot.logical_units",
        "Created snapshot logical units must exactly preserve the create request logical units.",
      );
    } else {
      requireEqual(
        envelope.before_batch_head,
        precondition.expected_batch_head,
        "$.receipt.authority_envelope.before_batch_head",
        "Authority receipt before-batch head must exactly equal the mutation precondition.",
      );
      requireEqual(
        snapshotBinding.binding_hash,
        precondition.expected_binding_hash,
        "$.receipt.authority_envelope.result_snapshot.binding.binding_hash",
        "Authority receipt snapshot must preserve the mutation expected binding hash.",
      );
      requireEqual(
        snapshotBinding.owner_batch_id,
        requestRecord.owner_batch_id,
        "$.receipt.authority_envelope.result_snapshot.binding.owner_batch_id",
        "Authority receipt snapshot must identify the mutation owner batch.",
      );
      requireEqual(
        snapshotBinding.purpose_profile_hash,
        requestRecord.purpose_profile_hash,
        "$.receipt.authority_envelope.result_snapshot.binding.purpose_profile_hash",
        "Authority receipt snapshot must preserve the mutation purpose profile.",
      );
      validateAuthorityResultForMutation(
        requestRecord,
        snapshot,
        "$.receipt.authority_envelope.result_snapshot",
      );
      validateResultClaimAtCommit(
        requestRecord,
        snapshot,
        batchEvent,
        "$.receipt.authority_envelope.result_snapshot",
      );
    }
    return receipt;
  });
}

export function verifyWorkflowBatchExecutionControlAuthorityTransitionV1(
  beforeObservation: unknown | null,
  receipt: unknown,
): WorkflowBatchExecutionControlDecodeResultV1 {
  return projectionResult(() => {
    validateAuthorityReceipt(receipt, "$.receipt");
    const receiptRecord = requireRecord(receipt, "$.receipt");
    const envelope = requireRecord(receiptRecord.authority_envelope, "$.receipt.authority_envelope");
    const batchEvent = requireRecord(envelope.batch_event, "$.receipt.authority_envelope.batch_event");
    const eventType = batchEvent.event_type as string;

    if (beforeObservation === null) {
      if (eventType !== "batch_opened" || envelope.before_batch_head !== null) {
        fail(
          "invalid_scalar",
          "$.before_observation",
          "Only the initial batch_opened transition may omit a prior fixed-head readback.",
        );
      }
      return receipt;
    }
    if (eventType === "batch_opened") {
      fail(
        "invalid_scalar",
        "$.before_observation",
        "The initial batch_opened transition requires a null prior readback.",
      );
    }

    validateReadObservation(beforeObservation, "$.before_observation");
    validateObservationProjectedHash(beforeObservation, "$.before_observation");
    const observation = requireRecord(beforeObservation, "$.before_observation");
    const query = requireRecord(observation.query_binding, "$.before_observation.query_binding");
    if (query.operation !== "read_batch_snapshot") {
      fail(
        "invalid_discriminator",
        "$.before_observation.query_binding.operation",
        "Authority transition verification requires a read_batch_snapshot observation.",
      );
    }
    requireEqual(
      observation.pins,
      envelope.pins,
      "$.before_observation.pins",
      "Prior readback pins must exactly match the authority receipt pins.",
    );
    requireEqual(
      observation.scope,
      envelope.scope,
      "$.before_observation.scope",
      "Prior readback scope must exactly match the authority receipt scope.",
    );
    requireEqual(
      observation.as_of_batch_head,
      envelope.before_batch_head,
      "$.before_observation.as_of_batch_head",
      "Prior readback batch head must exactly match the authority before-batch head.",
    );
    requireEqual(
      observation.as_of_global_head,
      envelope.before_global_head,
      "$.before_observation.as_of_global_head",
      "Prior readback global head must exactly match the authority before-global head.",
    );
    validateAuthoritySnapshotTransition(
      eventType,
      batchEvent.owner_event_at as string,
      requireRecord(observation.result, "$.before_observation.result"),
      requireRecord(envelope.result_snapshot, "$.receipt.authority_envelope.result_snapshot"),
      "$.receipt.authority_envelope.result_snapshot",
    );
    return receipt;
  });
}

export function verifyWorkflowBatchExecutionControlResumeObservationV1(
  request: unknown,
  observation: unknown,
): WorkflowBatchExecutionControlDecodeResultV1 {
  return projectionResult(() => {
    validateResumeOpenInput(request, "$.request");
    validateReadObservation(observation, "$.observation");
    validateObservationProjectedHash(observation, "$.observation");

    const requestRecord = requireRecord(request, "$.request");
    const precondition = requireRecord(requestRecord.precondition, "$.request.precondition");
    const observationRecord = requireRecord(observation, "$.observation");
    const snapshot = requireRecord(observationRecord.result, "$.observation.result");
    const binding = requireRecord(snapshot.binding, "$.observation.result.binding");

    requireEqual(
      observationRecord.query_binding,
      requestRecord.query,
      "$.observation.query_binding",
      "Resume observation query binding must exactly equal the resume request query binding.",
    );
    requireEqual(
      observationRecord.pins,
      requestRecord.expected_pins,
      "$.observation.pins",
      "Resume observation pins must exactly equal the request pins.",
    );
    requireEqual(
      observationRecord.scope,
      requestRecord.scope,
      "$.observation.scope",
      "Resume observation scope must exactly equal the request scope.",
    );
    requireEqual(
      observationRecord.as_of_batch_head,
      precondition.expected_batch_head,
      "$.observation.as_of_batch_head",
      "Resume observation batch head must exactly equal the request precondition.",
    );
    requireEqual(
      observationRecord.as_of_global_head,
      precondition.expected_global_head,
      "$.observation.as_of_global_head",
      "Resume observation global head must exactly equal the request precondition.",
    );
    requireEqual(
      binding.client_generation_key,
      requestRecord.client_generation_key,
      "$.observation.result.binding.client_generation_key",
      "Resume observation must identify the requested client generation key.",
    );
    requireEqual(
      binding.binding_hash,
      precondition.expected_binding_hash,
      "$.observation.result.binding.binding_hash",
      "Resume observation must preserve the expected immutable binding hash.",
    );
    return observation;
  });
}

export function verifyWorkflowBatchExecutionControlCommittedOutcomeResolutionV1(
  observation: unknown,
  resolved: unknown,
): WorkflowBatchExecutionControlDecodeResultV1 {
  return projectionResult(() => {
    validateReadObservation(observation, "$.observation");
    validateObservationProjectedHash(observation, "$.observation");
    validateResolvedEnvelope(resolved, "$.resolved");

    const observationRecord = requireRecord(observation, "$.observation");
    const query = requireRecord(observationRecord.query_binding, "$.observation.query_binding");
    if (query.operation !== "read_request_outcome") {
      fail(
        "invalid_discriminator",
        "$.observation.query_binding.operation",
        "Committed outcome resolution requires a read_request_outcome observation.",
      );
    }
    const outcome = requireRecord(observationRecord.result, "$.observation.result");
    if (outcome.kind !== "committed") {
      fail(
        "invalid_discriminator",
        "$.observation.result.kind",
        "Committed outcome resolution requires a committed result.",
      );
    }
    const resolvedRecord = requireRecord(resolved, "$.resolved");
    const envelope = requireRecord(resolvedRecord.authority_envelope, "$.resolved.authority_envelope");
    const snapshot = requireRecord(envelope.result_snapshot, "$.resolved.authority_envelope.result_snapshot");
    const binding = requireRecord(snapshot.binding, "$.resolved.authority_envelope.result_snapshot.binding");
    const outcomeBatchHead = observationRecord.as_of_batch_head;
    if (outcomeBatchHead === null) {
      fail(
        "invalid_scalar",
        "$.observation.as_of_batch_head",
        "A committed outcome must be observed at a non-null batch head that covers the resolved commit.",
      );
    }
    const observedBatchHead = requireRecord(outcomeBatchHead, "$.observation.as_of_batch_head");
    const resolvedBatchHead = requireRecord(envelope.after_batch_head, "$.resolved.authority_envelope.after_batch_head");
    requireEqual(
      observedBatchHead.owner_batch_id,
      resolvedBatchHead.owner_batch_id,
      "$.observation.as_of_batch_head.owner_batch_id",
      "Committed outcome batch head must identify the resolved authority batch.",
    );
    for (const key of ["ledger_sequence", "snapshot_version"] as const) {
      if (BigInt(observedBatchHead[key] as string) < BigInt(resolvedBatchHead[key] as string)) {
        fail(
          "invalid_scalar",
          `$.observation.as_of_batch_head.${key}`,
          `Committed outcome ${key} must be at or after the resolved authority head.`,
        );
      }
    }
    if (
      (observedBatchHead.ledger_sequence === resolvedBatchHead.ledger_sequence ||
        observedBatchHead.snapshot_version === resolvedBatchHead.snapshot_version) &&
      observedBatchHead.last_event_hash !== resolvedBatchHead.last_event_hash
    ) {
      fail(
        "invalid_scalar",
        "$.observation.as_of_batch_head.last_event_hash",
        "An equal committed-outcome batch sequence/version must preserve the resolved event hash.",
      );
    }
    const observedGlobalHead = requireRecord(
      observationRecord.as_of_global_head,
      "$.observation.as_of_global_head",
    );
    const resolvedGlobalHead = requireRecord(
      envelope.after_global_head,
      "$.resolved.authority_envelope.after_global_head",
    );
    for (const key of ["ledger_sequence", "registry_version"] as const) {
      if (BigInt(observedGlobalHead[key] as string) < BigInt(resolvedGlobalHead[key] as string)) {
        fail(
          "invalid_scalar",
          `$.observation.as_of_global_head.${key}`,
          `Committed outcome global ${key} must be at or after the resolved authority head.`,
        );
      }
    }
    if (
      (observedGlobalHead.ledger_sequence === resolvedGlobalHead.ledger_sequence ||
        observedGlobalHead.registry_version === resolvedGlobalHead.registry_version) &&
      observedGlobalHead.last_event_hash !== resolvedGlobalHead.last_event_hash
    ) {
      fail(
        "invalid_scalar",
        "$.observation.as_of_global_head.last_event_hash",
        "An equal committed-outcome global sequence/version must preserve the resolved event hash.",
      );
    }
    if ((observationRecord.observed_at as string) < (envelope.owner_issued_at as string)) {
      fail(
        "invalid_scalar",
        "$.observation.observed_at",
        "A committed outcome cannot be observed before the resolved authority envelope was issued.",
      );
    }

    requireEqual(
      resolvedRecord.receipt_ref,
      outcome.receipt_ref,
      "$.resolved.receipt_ref",
      "Resolved envelope must match the committed outcome receipt ref.",
    );
    requireEqual(
      resolvedRecord.authority_envelope_hash,
      outcome.authority_envelope_hash,
      "$.resolved.authority_envelope_hash",
      "Resolved envelope hash must match the committed outcome authority hash.",
    );
    requireEqual(
      envelope.pins,
      observationRecord.pins,
      "$.resolved.authority_envelope.pins",
      "Resolved envelope pins must match the outcome observation pins.",
    );
    requireEqual(
      envelope.scope,
      observationRecord.scope,
      "$.resolved.authority_envelope.scope",
      "Resolved envelope scope must match the outcome observation scope.",
    );
    requireEqual(
      binding.client_generation_key,
      query.client_generation_key,
      "$.resolved.authority_envelope.result_snapshot.binding.client_generation_key",
      "Resolved envelope must identify the outcome lookup client generation key.",
    );
    requireEqual(
      envelope.causation,
      expectedClientCommandCausation(query),
      "$.resolved.authority_envelope.causation",
      "Resolved envelope causation must match the outcome lookup request identity.",
    );
    return resolved;
  });
}

export function verifyWorkflowBatchExecutionControlResolvedEnvelopeV1(
  input: unknown,
  resolved: unknown,
): WorkflowBatchExecutionControlDecodeResultV1 {
  return projectionResult(() => {
    validateResolverInput(input, "$.input");
    validateResolvedEnvelope(resolved, "$.resolved");
    const inputRecord = requireRecord(input, "$.input");
    const resolvedRecord = requireRecord(resolved, "$.resolved");
    const envelope = requireRecord(resolvedRecord.authority_envelope, "$.resolved.authority_envelope");
    requireEqual(
      resolvedRecord.receipt_ref,
      inputRecord.receipt_ref,
      "$.resolved.receipt_ref",
      "Resolved envelope must match the requested receipt ref.",
    );
    requireEqual(
      envelope.pins,
      inputRecord.expected_pins,
      "$.resolved.authority_envelope.pins",
      "Resolved envelope pins must match the resolver request pins.",
    );
    return resolved;
  });
}

export function verifyWorkflowBatchExecutionControlReadObservationV1(
  input: unknown,
  observation: unknown,
): WorkflowBatchExecutionControlDecodeResultV1 {
  return projectionResult(() => {
    validateReadQuery(input, "$.input");
    validateReadObservation(observation, "$.observation");
    const inputRecord = requireRecord(input, "$.input");
    const observationRecord = requireRecord(observation, "$.observation");
    validateProjectedHash(
      observationRecord.read_observation_hash,
      workflowBatchExecutionControlReadObservationDomainPrefixV1,
      buildReadObservationHashProjection(observation),
      "$.observation.read_observation_hash",
      "Read-observation hash",
    );
    requireEqual(
      observationRecord.query_binding,
      inputRecord.query,
      "$.observation.query_binding",
      "Read observation query binding must exactly equal the read request query binding.",
    );
    requireEqual(
      observationRecord.pins,
      inputRecord.expected_pins,
      "$.observation.pins",
      "Read observation pins must exactly equal the read request pins.",
    );
    requireEqual(
      observationRecord.scope,
      inputRecord.scope,
      "$.observation.scope",
      "Read observation scope must exactly equal the read request scope.",
    );
    requireEqual(
      observationRecord.as_of_batch_head,
      inputRecord.as_of_batch_head,
      "$.observation.as_of_batch_head",
      "Read observation batch head must exactly equal the requested fixed batch head.",
    );
    requireEqual(
      observationRecord.as_of_global_head,
      inputRecord.as_of_global_head,
      "$.observation.as_of_global_head",
      "Read observation global head must exactly equal the requested fixed global head.",
    );
    if ((readPageOperations as readonly string[]).includes(inputRecord.operation as string)) {
      const page = requireRecord(observationRecord.page, "$.observation.page");
      requireEqual(
        page.cursor_start,
        inputRecord.cursor,
        "$.observation.page.cursor_start",
        "Read observation cursor start must equal the requested cursor.",
      );
      requireEqual(
        page.limit,
        inputRecord.limit,
        "$.observation.page.limit",
        "Read observation page limit must equal the requested limit.",
      );
    }
    return observation;
  });
}

function rejectProjectionContainer(value: unknown): void {
  if (!isRecord(value)) return;
  if (Object.hasOwn(value, "request_hash_projection")) {
    fail(
      "invalid_hash_projection",
      "$.request_hash_projection",
      "Request-hash projection is internal and cannot be caller supplied.",
    );
  }
  if (Object.hasOwn(value, "authority_envelope_hash_projection")) {
    fail(
      "invalid_hash_projection",
      "$.authority_envelope_hash_projection",
      "Authority-envelope hash projection is internal and cannot contain its output hash.",
    );
  }
  if (Object.hasOwn(value, "read_observation_hash_projection")) {
    fail(
      "invalid_hash_projection",
      "$.read_observation_hash_projection",
      "Read-observation hash projection is internal and cannot contain its output hash.",
    );
  }
}

function validateDocument(value: unknown, kind: WorkflowBatchExecutionControlDocumentKindV1): void {
  rejectProjectionContainer(value);
  switch (kind) {
    case "open_input":
      validateOpenInput(value, "$");
      if (requireRecord(value, "$").kind === "create_if_absent") {
        const record = requireRecord(value, "$");
        const requestMeta = requireRecord(record.request_meta, "$.request_meta");
        validateProjectedHash(
          requestMeta.request_hash,
          workflowBatchExecutionControlRequestDomainPrefixV1,
          buildRequestHashProjection(value),
          "$.request_meta.request_hash",
          "Create request hash",
        );
      }
      break;
    case "mutation_command": {
      validateMutationCommand(value, "$");
      const record = requireRecord(value, "$");
      const requestMeta = requireRecord(record.request_meta, "$.request_meta");
      validateProjectedHash(
        requestMeta.request_hash,
        workflowBatchExecutionControlRequestDomainPrefixV1,
        buildRequestHashProjection(value),
        "$.request_meta.request_hash",
        "Mutation request hash",
      );
      break;
    }
    case "read_query":
      validateReadQuery(value, "$");
      break;
    case "authority_envelope": {
      const record = requireRecord(value, "$");
      validateProjectedHash(
        record.authority_envelope_hash,
        workflowBatchExecutionControlAuthorityEnvelopeDomainPrefixV1,
        buildAuthorityEnvelopeHashProjection(value),
        "$.authority_envelope_hash",
        "Authority-envelope hash",
      );
      break;
    }
    case "authority_receipt":
      validateAuthorityReceipt(value, "$");
      break;
    case "read_observation": {
      const record = requireRecord(value, "$");
      validateProjectedHash(
        record.read_observation_hash,
        workflowBatchExecutionControlReadObservationDomainPrefixV1,
        buildReadObservationHashProjection(value),
        "$.read_observation_hash",
        "Read-observation hash",
      );
      break;
    }
    case "resolver_input":
      validateResolverInput(value, "$");
      break;
    case "resolved_envelope":
      validateResolvedEnvelope(value, "$");
      break;
  }
}

function validateReasonCode(value: unknown, path: string): void {
  if (typeof value !== "string" || !reasonCodePattern.test(value)) {
    fail("invalid_scalar", path, "Expected a canonical lowercase reason code.");
  }
  if (Buffer.byteLength(value, "utf8") > workflowBatchExecutionControlBoundsV1.max_reason_code_bytes) {
    fail("limit_exceeded", path, "Reason code exceeds the byte limit.");
  }
}

function validateCursor(value: unknown, path: string): void {
  if (value !== null && (typeof value !== "string" || !opaqueCursorPattern.test(value))) {
    fail("invalid_scalar", path, "Expected null or a canonical base64url opaque cursor.");
  }
}

export function decodeWorkflowBatchExecutionControlJsonV1(
  input: string,
  kind: WorkflowBatchExecutionControlDocumentKindV1,
): WorkflowBatchExecutionControlDecodeResultV1 {
  const maximumBytes =
    kind === "authority_receipt" || kind === "resolved_envelope"
      ? workflowBatchExecutionControlBoundsV1.max_resolved_envelope_bytes
      : kind === "authority_envelope" || kind === "read_observation"
        ? workflowBatchExecutionControlBoundsV1.max_canonical_envelope_bytes
        : workflowBatchExecutionControlBoundsV1.max_command_bytes;

  if (Buffer.byteLength(input, "utf8") > maximumBytes) {
    return {
      ok: false,
      findings: [
        {
          code: "document_too_large",
          path: "$",
          message: `Document exceeds ${maximumBytes} UTF-8 bytes.`,
        },
      ],
    };
  }

  try {
    const value = new DuplicateAwareJsonParser(input).parse();
    validateDocument(value, kind);
    return { ok: true, value };
  } catch (error) {
    if (error instanceof DecodeFailure) {
      return { ok: false, findings: [error.finding] };
    }
    return {
      ok: false,
      findings: [{ code: "invalid_json", path: "$", message: "Unable to decode protocol JSON." }],
    };
  }
}
