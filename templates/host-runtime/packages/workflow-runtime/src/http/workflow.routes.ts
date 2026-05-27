export const workflowRoutes = [
  "GET /api/workflow/scenarios",
  "GET /api/workflow/scenarios/{scenario_key}",
  "GET /api/workflow/capabilities",
  "GET /api/workflow/capabilities/{capability_key}",
  "GET /api/workflow/start-requirements",
  "POST /api/workflow/runs",
  "GET /api/workflow/runs/{run_id}",
  "GET /api/workflow/runs/{run_id}/timeline",
  "POST /api/workflow/actions",
  "GET /api/workflow/runs/{run_id}/artifacts",
  "GET /api/workflow/artifacts/{artifact_id}/preview",
  "POST /api/workflow/handoffs",
  "GET /api/workflow/dashboard/cards",
  "GET /api/workflow/dashboard/runs/{run_id}",
  "POST /api/workflow/chat/control",
  "GET /api/workflow/chat/dashboard-summary",
] as const;

export const workflowInternalRoutes = [
  "POST /api/internal/workflow/handoffs/{handoff_id}/receipts",
] as const;

export const workflowAdminRoutes = [
  "GET /api/admin/workflow/*",
  "POST /api/admin/workflow/*",
] as const;
