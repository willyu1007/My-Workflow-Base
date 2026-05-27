import type {
  HandoffInvalidationInput,
  HandoffReceiptInput,
  HandoffRequestInput,
  WorkflowHandoffResult,
} from "@host/workflow-contracts";

export type HandoffLedgerRepository = {
  request(input: HandoffRequestInput): Promise<WorkflowHandoffResult>;
  record_receipt(input: HandoffReceiptInput): Promise<WorkflowHandoffResult>;
  invalidate(input: HandoffInvalidationInput): Promise<WorkflowHandoffResult>;
};
