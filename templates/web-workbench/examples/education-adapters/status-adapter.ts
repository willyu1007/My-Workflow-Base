/**
 * Worked example: the "status is pre-resolved" boundary.
 *
 * The kit's `CellStatus` / `EntityRow.status` / `EntityCard.status` take a
 * `{ tone, label }` — never a raw status string. The host owns the single map
 * from its status vocabulary → tone + label, and resolves it in the adapter.
 * That map is the one place status meaning lives, so the kit carries none.
 */
import type { CardTone } from "@willyu1007/web-workbench";

/** The host's status vocabulary → tone + label (single source of truth). */
const STUDENT_STATUS: Record<string, { tone: CardTone; label: string }> = {
  active: { tone: "success", label: "正常" },
  archived: { tone: "muted", label: "已归档" },
  deleted: { tone: "danger", label: "已删除" },
};

export function studentStatus(status: string): { tone: CardTone; label: string } {
  return STUDENT_STATUS[status] ?? { tone: "muted", label: status };
}

// Usage in a table column:
//   import { CellStatus } from "@willyu1007/web-workbench";
//   render: (s) => <CellStatus {...studentStatus(s.status)} />
