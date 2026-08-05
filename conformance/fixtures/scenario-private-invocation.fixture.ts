import type { ScenarioPrivateInvocationV1 } from "@host/workflow-contracts";

export const scenarioPrivateInvocationFixture = {
  invocation_version: 1,
  contract_version: 1,
  contract_hash: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  issuer: "my_chat.host",
  assertion_audience: "scenario.private",
  caller_binding: { caller_subject: "my-chat-host-runtime" },
  principal: {
    principal_version: 1,
    principal_kind: "human_user",
    account_ref: {
      schema_version: 1,
      namespace: "my_chat",
      object_type: "user",
      object_id: "user_01",
    },
    actor_ref: {
      schema_version: 1,
      namespace: "my_chat",
      object_type: "actor",
      object_id: "actor_01",
    },
    workspace_ref: {
      schema_version: 1,
      namespace: "my_chat",
      object_type: "workspace",
      object_id: "workspace_01",
    },
    principal_origin: "interactive_session",
  },
  route: {
    scenario_key: "example-scenario",
    endpoint_key: "private.invoke",
    method: "POST",
    ingress: {
      ingress_version: 1,
      ingress_category: "product_surface",
      ingress_key: "chat.scenario-action",
    },
  },
  request: {
    request_id: "request_01",
    correlation_id: "correlation_01",
    trace_id: "trace_01",
    issued_at: "2026-08-05T00:00:00.000Z",
    expires_at: "2026-08-05T00:00:30.000Z",
    nonce: "0123456789abcdef0123456789abcdef",
  },
  operation: {
    operation_key: "example.execute",
    input_schema_version: 1,
    input: { example_field: "example-value" },
  },
} satisfies ScenarioPrivateInvocationV1<{ example_field: string }>;
