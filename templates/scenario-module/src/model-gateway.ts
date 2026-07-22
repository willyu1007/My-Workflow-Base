import type { CanonicalRef, GenerationTicketV1 } from "@host/workflow-contracts";

export type ModelGatewayRequest = {
  generation_ticket: GenerationTicketV1;
  domain_prompt_intent: string;
  domain_template_key: string;
  input_refs: CanonicalRef[];
};

export type ModelGatewayResult = {
  output_ref: CanonicalRef;
  generation_record_ref: CanonicalRef;
};

/**
 * The scenario owns intent/templates. The host owns provider routing and injects
 * morethan brand, safety, privacy, and China compliance policy.
 */
export type ModelGatewayPort = {
  generate(input: ModelGatewayRequest): Promise<ModelGatewayResult>;
};
