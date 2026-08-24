import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "../..");
const vectorPath = join(repositoryRoot, "conformance/vectors/batch-execution-control-v1.json");
const strictDecoderPath = join(
  repositoryRoot,
  "templates/host-runtime/packages/workflow-runtime/src/validation/validate-batch-execution-control.ts",
);
const contractIndexPath = join(
  repositoryRoot,
  "templates/host-runtime/packages/workflow-contracts/src/index.ts",
);
const positiveFixturePath = join(
  repositoryRoot,
  "conformance/fixtures/batch-execution-control-v1.fixture.ts",
);

const lockedKinds = {
  request: {
    domainPrefix: "workflow_batch_execution_control_v1/request\u0000",
    outputHashPath: ["request_meta", "request_hash"],
    decoderKind: "open_input",
    projectionExport: "createWorkflowBatchExecutionControlRequestHashProjectionV1",
  },
  authority_envelope: {
    domainPrefix: "workflow_batch_execution_control_v1/authority-envelope\u0000",
    outputHashPath: ["authority_envelope_hash"],
    preallocatedRefPath: ["receipt_ref"],
    decoderKind: "authority_envelope",
    projectionExport: "createWorkflowBatchExecutionControlAuthorityEnvelopeHashProjectionV1",
  },
  read_observation: {
    domainPrefix: "workflow_batch_execution_control_v1/read-observation\u0000",
    outputHashPath: ["read_observation_hash"],
    preallocatedRefPath: ["observation_ref"],
    decoderKind: "read_observation",
    projectionExport: "createWorkflowBatchExecutionControlReadObservationHashProjectionV1",
  },
};

const transpiledModuleCache = new Map();

function resolveTypeScriptModule(specifier, importerPath) {
  if (specifier === "@host/workflow-contracts") return contractIndexPath;
  if (!specifier.startsWith(".")) return null;
  const resolvedPath = resolve(dirname(importerPath), specifier);
  const candidates = [
    resolvedPath,
    resolvedPath.replace(/\.js$/, ".ts"),
    join(resolvedPath, "index.ts"),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function loadTypeScriptModule(modulePath) {
  const absolutePath = resolve(modulePath);
  const cached = transpiledModuleCache.get(absolutePath);
  if (cached) return cached.exports;

  const source = readFileSync(absolutePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: absolutePath,
    reportDiagnostics: true,
  });
  const errors = (compiled.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  if (errors.length > 0) {
    throw new Error(`${absolutePath}: TypeScript transpilation failed: ${errors[0].messageText}`);
  }

  const runtimeModule = { exports: {} };
  transpiledModuleCache.set(absolutePath, runtimeModule);
  const runtimeRequire = createRequire(absolutePath);
  const localRequire = (specifier) => {
    const dependencyPath = resolveTypeScriptModule(specifier, absolutePath);
    return dependencyPath === null ? runtimeRequire(specifier) : loadTypeScriptModule(dependencyPath);
  };
  const evaluate = new Function("require", "module", "exports", compiled.outputText);
  evaluate(localRequire, runtimeModule, runtimeModule.exports);
  return runtimeModule.exports;
}

function loadStrictRuntime() {
  const runtime = loadTypeScriptModule(strictDecoderPath);
  if (typeof runtime.decodeWorkflowBatchExecutionControlJsonV1 !== "function") {
    throw new Error("strict decoder does not export decodeWorkflowBatchExecutionControlJsonV1");
  }
  for (const lock of Object.values(lockedKinds)) {
    if (typeof runtime[lock.projectionExport] !== "function") {
      throw new Error(`strict decoder does not export ${lock.projectionExport}`);
    }
  }
  return runtime;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function assertWellFormedUnicode(value, location) {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const nextCodeUnit = value.charCodeAt(index + 1);
      if (!(nextCodeUnit >= 0xdc00 && nextCodeUnit <= 0xdfff)) {
        throw new Error(`${location} contains an unpaired high surrogate`);
      }
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      throw new Error(`${location} contains an unpaired low surrogate`);
    }
  }
}

function canonicalize(value, location = "$") {
  if (value === null || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "string") {
    assertWellFormedUnicode(value, location);
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`${location} contains a non-finite number`);
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item, index) => canonicalize(item, `${location}[${index}]`)).join(",")}]`;
  }
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error(`${location} is not a plain JSON object`);
    }
    return `{${Object.keys(value)
      .sort()
      .map((key) => {
        assertWellFormedUnicode(key, `${location} key`);
        const memberValue = value[key];
        if (memberValue === undefined) {
          throw new Error(`${location}.${key} is undefined`);
        }
        return `${JSON.stringify(key)}:${canonicalize(memberValue, `${location}.${key}`)}`;
      })
      .join(",")}}`;
  }
  throw new Error(`${location} contains unsupported JSON type ${typeof value}`);
}

function assertLowercaseHash(value, location) {
  if (!/^[a-f0-9]{64}$/.test(value ?? "")) {
    throw new Error(`${location} must be a lowercase SHA-256 hex string`);
  }
}

function assertDeepEqual(actual, expected, message) {
  if (canonicalize(actual) !== canonicalize(expected)) {
    throw new Error(message);
  }
}

function pathLabel(path) {
  return path.join(".");
}

function parentAtPath(target, path) {
  if (!Array.isArray(path) || path.length === 0 || path.some((part) => typeof part !== "string")) {
    throw new Error("JSON path must be a non-empty string array");
  }
  let parent = target;
  for (const part of path.slice(0, -1)) {
    if (parent === null || typeof parent !== "object" || !Object.hasOwn(parent, part)) {
      throw new Error(`path does not exist: ${pathLabel(path)}`);
    }
    parent = parent[part];
  }
  return { parent, leaf: path.at(-1) };
}

function hasPath(target, path) {
  try {
    const { parent, leaf } = parentAtPath(target, path);
    return parent !== null && typeof parent === "object" && Object.hasOwn(parent, leaf);
  } catch {
    return false;
  }
}

function valueAtPath(target, path) {
  const { parent, leaf } = parentAtPath(target, path);
  if (parent === null || typeof parent !== "object" || !Object.hasOwn(parent, leaf)) {
    throw new Error(`path does not exist: ${pathLabel(path)}`);
  }
  return parent[leaf];
}

function projectionFromDocument(document, outputHashPath) {
  const projection = structuredClone(document);
  const { parent, leaf } = parentAtPath(projection, outputHashPath);
  if (parent === null || typeof parent !== "object" || !Object.hasOwn(parent, leaf)) {
    throw new Error(`document output hash path does not exist: ${pathLabel(outputHashPath)}`);
  }
  delete parent[leaf];
  return projection;
}

function setPath(target, path, replacement, remove) {
  const { parent, leaf } = parentAtPath(target, path);
  if (parent === null || typeof parent !== "object" || !Object.hasOwn(parent, leaf)) {
    throw new Error(`tamper path does not exist: ${pathLabel(path)}`);
  }
  if (remove) {
    delete parent[leaf];
  } else {
    parent[leaf] = replacement;
  }
}

function domainHash(domainPrefix, projection) {
  return sha256(Buffer.concat([Buffer.from(domainPrefix, "utf8"), Buffer.from(canonicalize(projection), "utf8")]));
}

const vectors = JSON.parse(readFileSync(vectorPath, "utf8"));
const strictRuntime = loadStrictRuntime();
const decodeStrictJson = strictRuntime.decodeWorkflowBatchExecutionControlJsonV1;
const positiveFixtures = loadTypeScriptModule(positiveFixturePath);
if (vectors.schema_version !== "workflow_batch_execution_control_canonical_vectors_v1") {
  throw new Error("unexpected canonical vector schema_version");
}
if (vectors.canonicalization_profile !== "rfc8785_jcs_sha256_v1") {
  throw new Error("unexpected canonicalization profile");
}

const seenKinds = new Set();
for (const vector of vectors.vectors ?? []) {
  const lock = lockedKinds[vector.kind];
  if (!lock) {
    throw new Error(`${vector.name ?? "unnamed vector"}: unknown kind ${vector.kind}`);
  }
  if (seenKinds.has(vector.kind)) {
    throw new Error(`${vector.name}: duplicate golden vector kind ${vector.kind}`);
  }
  seenKinds.add(vector.kind);

  if (vector.domain_prefix !== lock.domainPrefix) {
    throw new Error(`${vector.name}: domain prefix differs from the BC0 contract lock`);
  }
  if (JSON.stringify(vector.output_hash_path) !== JSON.stringify(lock.outputHashPath)) {
    throw new Error(`${vector.name}: output hash path differs from the BC0 contract lock`);
  }
  if (!hasPath(vector.document, lock.outputHashPath)) {
    throw new Error(`${vector.name}: document is missing ${pathLabel(lock.outputHashPath)}`);
  }
  if (hasPath(vector.projection, lock.outputHashPath)) {
    throw new Error(`${vector.name}: projection contains its own ${pathLabel(lock.outputHashPath)}`);
  }

  const derivedProjection = projectionFromDocument(vector.document, lock.outputHashPath);
  assertDeepEqual(
    derivedProjection,
    vector.projection,
    `${vector.name}: projection is not the document with only ${pathLabel(lock.outputHashPath)} excluded`,
  );

  const runtimeProjection = strictRuntime[lock.projectionExport](vector.document);
  if (!runtimeProjection.ok) {
    throw new Error(`${vector.name}: runtime projection helper rejected the golden document`);
  }
  assertDeepEqual(
    runtimeProjection.value,
    vector.projection,
    `${vector.name}: runtime projection helper differs from the golden projection`,
  );

  const decoded = decodeStrictJson(JSON.stringify(vector.document), lock.decoderKind);
  if (!decoded.ok) {
    const finding = decoded.findings?.[0];
    throw new Error(
      `${vector.name}: strict decoder rejected legal ${lock.decoderKind} DTO at ` +
        `${finding?.path ?? "$"}: ${finding?.code ?? "unknown"} ${finding?.message ?? ""}`,
    );
  }

  const canonicalProjection = canonicalize(vector.projection);
  const projectionHash = sha256(Buffer.from(canonicalProjection, "utf8"));
  const calculatedDomainHash = domainHash(lock.domainPrefix, vector.projection);
  assertLowercaseHash(vector.expected_projection_sha256, `${vector.name}.expected_projection_sha256`);
  assertLowercaseHash(vector.expected_domain_hash, `${vector.name}.expected_domain_hash`);
  if (projectionHash !== vector.expected_projection_sha256) {
    throw new Error(
      `${vector.name}: projection SHA-256 mismatch; expected ` +
        `${vector.expected_projection_sha256}, calculated ${projectionHash}`,
    );
  }
  if (calculatedDomainHash !== vector.expected_domain_hash) {
    throw new Error(
      `${vector.name}: domain hash mismatch; expected ` +
        `${vector.expected_domain_hash}, calculated ${calculatedDomainHash}`,
    );
  }
  if (valueAtPath(vector.document, lock.outputHashPath) !== vector.expected_domain_hash) {
    throw new Error(`${vector.name}: document output hash does not equal the golden domain hash`);
  }

  assertLowercaseHash(vector.mutated_output_hash, `${vector.name}.mutated_output_hash`);
  if (vector.mutated_output_hash === vector.expected_domain_hash) {
    throw new Error(`${vector.name}: mutated output hash must differ from the golden hash`);
  }
  const mutatedDocument = structuredClone(vector.document);
  setPath(mutatedDocument, lock.outputHashPath, vector.mutated_output_hash, false);
  const mutatedProjection = projectionFromDocument(mutatedDocument, lock.outputHashPath);
  if (domainHash(lock.domainPrefix, mutatedProjection) !== vector.expected_domain_hash) {
    throw new Error(`${vector.name}: changing the excluded output hash changed the projection hash`);
  }
  const runtimeMutatedProjection = strictRuntime[lock.projectionExport](mutatedDocument);
  if (!runtimeMutatedProjection.ok) {
    throw new Error(`${vector.name}: runtime projection helper rejected the mutated output hash`);
  }
  assertDeepEqual(
    runtimeMutatedProjection.value,
    vector.projection,
    `${vector.name}: runtime projection helper included the mutated output hash`,
  );

  if (lock.preallocatedRefPath) {
    const preallocatedRef = vector.preallocated_ref;
    if (
      JSON.stringify(preallocatedRef?.path) !== JSON.stringify(lock.preallocatedRefPath) ||
      typeof preallocatedRef.value !== "string"
    ) {
      throw new Error(`${vector.name}: missing locked preallocated ${pathLabel(lock.preallocatedRefPath)}`);
    }
    if (
      valueAtPath(vector.document, lock.preallocatedRefPath) !== preallocatedRef.value ||
      valueAtPath(vector.projection, lock.preallocatedRefPath) !== preallocatedRef.value
    ) {
      throw new Error(`${vector.name}: preallocated ref must exist before and inside hashing`);
    }
  } else if (vector.preallocated_ref !== undefined) {
    throw new Error(`${vector.name}: request vectors must not declare a receipt/observation ref`);
  }

  const tamperCases = vector.tamper_cases ?? [];
  if (!tamperCases.some((tamper) => tamper.remove === true)) {
    throw new Error(`${vector.name}: no omitted-projection-field tamper case`);
  }
  if (!tamperCases.some((tamper) => tamper.remove !== true)) {
    throw new Error(`${vector.name}: no changed-projection-field tamper case`);
  }
  if (
    lock.preallocatedRefPath &&
    !tamperCases.some(
      (tamper) =>
        tamper.remove !== true &&
        JSON.stringify(tamper.path) === JSON.stringify(lock.preallocatedRefPath),
    )
  ) {
    throw new Error(`${vector.name}: no preallocated-ref tamper case`);
  }

  for (const tamper of tamperCases) {
    assertLowercaseHash(tamper.expected_domain_hash, `${vector.name}.${tamper.name}.expected_domain_hash`);
    const tamperedProjection = structuredClone(vector.projection);
    setPath(tamperedProjection, tamper.path, tamper.replacement, tamper.remove === true);
    const tamperedHash = domainHash(lock.domainPrefix, tamperedProjection);
    if (tamperedHash === vector.expected_domain_hash) {
      throw new Error(`${vector.name}.${tamper.name}: tamper did not change the domain hash`);
    }
    if (tamperedHash !== tamper.expected_domain_hash) {
      throw new Error(
        `${vector.name}.${tamper.name}: expected ${tamper.expected_domain_hash}, calculated ${tamperedHash}`,
      );
    }
  }
}

for (const kind of Object.keys(lockedKinds)) {
  if (!seenKinds.has(kind)) {
    throw new Error(`missing golden vector kind ${kind}`);
  }
}

let rejectedSelfReferences = 0;
for (const vector of vectors.negative_vectors ?? []) {
  const lock = lockedKinds[vector.kind];
  if (!lock || vector.expected_error !== "invalid_hash_projection") {
    throw new Error(`${vector.name ?? "unnamed negative vector"}: malformed self-reference case`);
  }
  if (JSON.stringify(vector.output_hash_path) !== JSON.stringify(lock.outputHashPath)) {
    throw new Error(`${vector.name}: negative output hash path differs from the BC0 contract lock`);
  }
  if (!hasPath(vector.projection, lock.outputHashPath)) {
    throw new Error(`${vector.name}: negative projection does not attempt self-reference`);
  }

  const goldenVector = vectors.vectors.find((candidate) => candidate.kind === vector.kind);
  if (!goldenVector || typeof vector.container_key !== "string") {
    throw new Error(`${vector.name}: negative vector has no golden document/container key`);
  }
  const selfReferentialDocument = structuredClone(goldenVector.document);
  selfReferentialDocument[vector.container_key] = structuredClone(vector.projection);
  const rejection = decodeStrictJson(JSON.stringify(selfReferentialDocument), lock.decoderKind);
  if (rejection.ok || rejection.findings?.[0]?.code !== vector.expected_error) {
    throw new Error(`${vector.name}: strict decoder did not reject the self-referential projection container`);
  }
  rejectedSelfReferences += 1;
}
if (rejectedSelfReferences !== Object.keys(lockedKinds).length) {
  throw new Error("canonical vectors must include a forbidden output-hash self-reference attempt");
}

function assertDecoded(name, value, kind) {
  const result = decodeStrictJson(JSON.stringify(value), kind);
  if (!result.ok) {
    const finding = result.findings?.[0];
    throw new Error(
      `${name}: strict decoder rejected positive fixture at ${finding?.path ?? "$"}: ` +
        `${finding?.code ?? "unknown"} ${finding?.message ?? ""}`,
    );
  }
}

for (const [name, fixture] of [
  ["create open", positiveFixtures.batchControlCreateRequestFixture],
  ["later-generation open", positiveFixtures.batchControlLaterGenerationRequestFixture],
  ["resume open", positiveFixtures.batchControlResumeRequestFixture],
]) {
  assertDecoded(name, fixture, "open_input");
}

const mutationFixtures = positiveFixtures.batchControlMutationCommandFixtures ?? [];
if (mutationFixtures.length !== 9 || new Set(mutationFixtures.map((fixture) => fixture.operation)).size !== 9) {
  throw new Error("positive fixtures must contain exactly one command for every mutation operation");
}
mutationFixtures.forEach((fixture) => assertDecoded(`mutation ${fixture.operation}`, fixture, "mutation_command"));

const readFixtures = positiveFixtures.batchControlReadInputFixtures ?? [];
if (readFixtures.length !== 8 || new Set(readFixtures.map((fixture) => fixture.operation)).size !== 8) {
  throw new Error("positive fixtures must contain exactly one input for every read operation");
}
readFixtures.forEach((fixture) => assertDecoded(`read ${fixture.operation}`, fixture, "read_query"));

assertDecoded("authority envelope", positiveFixtures.batchControlAuthorityEnvelopeFixture, "authority_envelope");
assertDecoded("authority receipt", positiveFixtures.batchControlAuthorityReceiptFixture, "authority_receipt");
assertDecoded("read observation", positiveFixtures.batchControlHistoryPageFixture, "read_observation");
assertDecoded("resolver input", positiveFixtures.batchControlResolverInputFixture, "resolver_input");
assertDecoded("resolved envelope", positiveFixtures.batchControlResolvedEnvelopeFixture, "resolved_envelope");

const snapshotFixtures = [
  ["reserved recovery snapshot", positiveFixtures.batchControlReservedRecoverySnapshotFixture],
  ["sealed recovery snapshot", positiveFixtures.batchControlSealedRecoverySnapshotFixture],
  ["dispatched recovery snapshot", positiveFixtures.batchControlDispatchedRecoverySnapshotFixture],
  ["quarantined snapshot", positiveFixtures.batchControlQuarantinedSnapshotFixture],
  ["reconciled unresolved snapshot", positiveFixtures.batchControlReconciledUnresolvedSnapshotFixture],
];
for (let index = 0; index < snapshotFixtures.length; index += 1) {
  const [name, snapshot] = snapshotFixtures[index];
  if (!snapshot) throw new Error(`${name}: missing exported positive snapshot fixture`);
  const observation = {
    schema_version: 1,
    observation_ref: `observation:snapshot-conformance-${index + 1}`,
    pins: snapshot.pins,
    scope: snapshot.scope,
    query_binding: {
      operation: "read_batch_snapshot",
      query_id: `query:snapshot-conformance-${index + 1}`,
      query_hash: sha256(`query:snapshot-conformance-${index + 1}`),
      read_policy: positiveFixtures.batchControlReadbackPolicyFixture,
    },
    as_of_batch_head: snapshot.batch_head,
    as_of_global_head: snapshot.global_head,
    page: {
      kind: "singleton",
      cursor_start: null,
      cursor_end: null,
      limit: 1,
      item_count: 1,
      page_hash: sha256(`page:snapshot-conformance-${index + 1}`),
      full_collection_root: sha256(`collection:snapshot-conformance-${index + 1}`),
    },
    result: snapshot,
    observed_at: "2026-07-23T00:10:00.000Z",
    read_observation_hash: "0".repeat(64),
  };
  const projectionResult = strictRuntime.createWorkflowBatchExecutionControlReadObservationHashProjectionV1(
    observation,
  );
  if (!projectionResult.ok) {
    const finding = projectionResult.findings?.[0];
    throw new Error(
      `${name}: snapshot projection rejected at ${finding?.path ?? "$"}: ${finding?.message ?? "unknown"}`,
    );
  }
  observation.read_observation_hash = sha256(
    `${lockedKinds.read_observation.domainPrefix}${canonicalize(projectionResult.value)}`,
  );
  assertDecoded(name, observation, "read_observation");
}

const canonicalFixtureEnvelope = canonicalize(positiveFixtures.batchControlAuthorityEnvelopeFixture);
const canonicalFixtureEnvelopeRawHash = sha256(canonicalFixtureEnvelope);
if (
  positiveFixtures.batchControlAuthorityReceiptFixture.canonical_envelope_utf8 !== canonicalFixtureEnvelope ||
  positiveFixtures.batchControlResolvedEnvelopeFixture.canonical_envelope_utf8 !== canonicalFixtureEnvelope ||
  positiveFixtures.batchControlAuthorityReceiptFixture.canonical_envelope_bytes_sha256 !==
    canonicalFixtureEnvelopeRawHash ||
  positiveFixtures.batchControlResolvedEnvelopeFixture.canonical_envelope_bytes_sha256 !==
    canonicalFixtureEnvelopeRawHash
) {
  throw new Error("positive receipt/resolved-envelope canonical bytes or raw SHA-256 are not exact");
}

const positiveRuntimeDtoCount = 3 + mutationFixtures.length + readFixtures.length + 5 + snapshotFixtures.length;
console.log(
  `batch execution-control canonical vectors ok: ${seenKinds.size} golden, ` +
    `${rejectedSelfReferences} self-reference negative, ${positiveRuntimeDtoCount} positive runtime DTOs`,
);
