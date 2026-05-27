export type WorkflowOutboxDispatcher = {
  dispatch_pending(input: { limit: number; worker_id: string }): Promise<{ dispatched: number }>;
};
