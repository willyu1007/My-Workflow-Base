import type { CanonicalRefV1, GenerationTicketV1 } from "@host/workflow-contracts";

export type ModelGatewayRequest = {
  generation_ticket: GenerationTicketV1;
  domain_prompt_intent: string;
  domain_template_key: string;
  input_refs: CanonicalRefV1[];
};

export type ModelGatewayResult = {
  output_ref: CanonicalRefV1;
  generation_record_ref: CanonicalRefV1;
};

/**
 * The scenario owns intent/templates. The host owns provider routing and injects
 * morethan brand, safety, privacy, and China compliance policy.
 */
export type ModelGatewayPort = {
  generate(input: ModelGatewayRequest): Promise<ModelGatewayResult>;
};
