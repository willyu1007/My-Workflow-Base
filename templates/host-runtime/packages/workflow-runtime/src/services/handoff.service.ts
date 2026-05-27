import type {
  HandoffInvalidationInput,
  HandoffReceiptInput,
  HandoffRequestInput,
  WorkflowHandoffResult,
} from "@host/workflow-contracts";
import type { HandoffLedgerRepository } from "../repositories/handoff-ledger.repository.js";

export class WorkflowHandoffService {
  constructor(private readonly handoffLedger: HandoffLedgerRepository) {}

  request(input: HandoffRequestInput): Promise<WorkflowHandoffResult> {
    return this.handoffLedger.request(input);
  }

  record_receipt(input: HandoffReceiptInput): Promise<WorkflowHandoffResult> {
    return this.handoffLedger.record_receipt(input);
  }

  invalidate(input: HandoffInvalidationInput): Promise<WorkflowHandoffResult> {
    return this.handoffLedger.invalidate(input);
  }
}
