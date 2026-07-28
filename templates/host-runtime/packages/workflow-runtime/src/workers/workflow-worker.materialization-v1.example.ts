import type {
  WorkflowCommandMeta,
  WorkflowRuntimePortMaterializationV1,
} from "@host/workflow-contracts";
import { resolveStepHandlerBinding } from "../registry/resolve-binding.js";
import type { WorkflowRegistry } from "../registry/loader.js";
import type { WorkflowWorkerPayload } from "./workflow-worker.js";

/**
 * Copyable v1 worker wiring example.
 *
 * The host injects the materialization-capable runtime port directly. Scenario
 * modules never supply or cast this authority through their legacy adapter.
 */
export class WorkflowWorkerMaterializationV1Example {
  constructor(
    private readonly registry: WorkflowRegistry,
    private readonly runtimePort: WorkflowRuntimePortMaterializationV1,
  ) {}

  async run(payload: WorkflowWorkerPayload): Promise<void> {
    const binding = resolveStepHandlerBinding(this.registry, payload);
    const meta: WorkflowCommandMeta = {
      workspace_id: payload.workspace_id,
      idempotency_key: `${payload.run_id}:${payload.step_id}:${payload.expected_step_version}`,
      correlation_id: payload.correlation_id,
      trace_id: payload.trace_id,
      client_surface: "worker_runtime",
    };

    const lease = await this.runtimePort.claim_step({
      run_id: payload.run_id,
      step_id: payload.step_id,
      expected_version: payload.expected_step_version,
      worker_id: payload.worker_id,
      meta,
    });

    try {
      const result = await binding.handler({
        run_id: payload.run_id,
        step_id: payload.step_id,
        step_key: payload.step_key,
        claim_token: lease.claim_token,
        expected_step_version: lease.aggregate_version,
        scenario_key: payload.scenario_key,
        capability_key: payload.capability_key,
        entrypoint_key: payload.entrypoint_key,
        workflow_version_id: payload.workflow_version_id,
        contract_hash: payload.contract_hash,
        meta,
      });

      await this.runtimePort.complete_step({
        completion_contract_version: 1,
        claim_token: lease.claim_token,
        run_id: payload.run_id,
        step_id: payload.step_id,
        expected_version: lease.aggregate_version,
        status: result.status ?? "completed",
        output_refs: result.output_refs,
        artifact_drafts: result.artifact_drafts,
        context_bindings: result.context_bindings,
        handoff_drafts: result.handoff_drafts,
        event_drafts: result.event_drafts,
        meta,
      });
    } catch (error) {
      await this.runtimePort.fail_step({
        run_id: payload.run_id,
        step_id: payload.step_id,
        expected_version: lease.aggregate_version,
        reason_code: "workflow_handler_failed",
        retryable: false,
        meta,
      });
      throw error;
    }
  }
}
