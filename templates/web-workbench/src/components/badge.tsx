/**
 * StatusBadge — generic semantic badge. Takes a pre-resolved `tone` + `label`
 * (the scenario maps its own status vocabulary → tone/label upstream), so this
 * component carries no domain vocabulary. Tone colors come from the shared
 * `mt-badge--*` palette.
 */
import type { CardTone } from "../contracts/card-model";

export function StatusBadge({
  tone,
  label,
  dot,
}: {
  readonly tone: CardTone;
  readonly label: string;
  readonly dot?: boolean;
}): React.ReactElement {
  return (
    <span className={`mt-badge mt-badge--${tone}${dot ? " mt-badge--dot" : ""}`}>{label}</span>
  );
}
