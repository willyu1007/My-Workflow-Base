/**
 * ActionButton — the quiet pill action used in the Scene toolbar and in rows.
 * Two tiers only: one `primary` (solid navy pill) per scene, the rest `ghost`.
 * Deliberately lighter than `.mt-btn` so the content (list/cards) stays the
 * visual focus. Renders a `Link` when `href` is set, else a `button`.
 */
"use client";

import type { ReactNode } from "react";
import { Link } from "./nav";

export function ActionButton({
  children,
  kind = "ghost",
  href,
  onClick,
  icon,
  ariaLabel,
  disabled,
}: {
  readonly children: ReactNode;
  readonly kind?: "primary" | "ghost";
  readonly href?: string;
  readonly onClick?: () => void;
  readonly icon?: ReactNode;
  readonly ariaLabel?: string;
  readonly disabled?: boolean;
}): React.ReactElement {
  const className = `wb-action${kind === "primary" ? " wb-action--primary" : ""}`;
  const body = (
    <>
      {icon && <span className="wb-action__icon">{icon}</span>}
      {children}
    </>
  );
  if (href && !disabled) {
    return (
      <Link href={href} className={className} aria-label={ariaLabel} {...(onClick ? { onClick } : {})}>
        {body}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      {body}
    </button>
  );
}
