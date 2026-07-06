/**
 * SceneSkeleton — the loading placeholder that mirrors <Scene>.
 *
 * Server-safe by design (no hooks, no "use client"), so a Next.js App Router
 * route `loading.tsx` can render it directly. That gives every route an instant,
 * on-brand loading state the moment a link is clicked — the fix for "click a nav
 * tab, stare at the old page until the server responds". Its outer structure
 * matches Scene (bar → stats → body), so the swap to real content lands without
 * a layout jump.
 *
 *   // app/(section)/loading.tsx
 *   import { SceneSkeleton } from "@willyu1007/web-workbench/primitives";
 *   export default function Loading() {
 *     return <SceneSkeleton />;
 *   }
 */
import type { ReactElement } from "react";

export function SceneSkeleton({
  bar = true,
  stats = 4,
  rows = 5,
}: {
  /** Render the scene-bar (nav / actions) placeholder row. */
  readonly bar?: boolean;
  /** Number of stat placeholders in the strip (0 omits the strip). */
  readonly stats?: number;
  /** Number of body-row placeholders. */
  readonly rows?: number;
}): ReactElement {
  return (
    <div className="wb-scene wb-stack wb-stack--lg" aria-busy="true" aria-live="polite">
      <span className="wb-sr-only">正在加载</span>
      {bar && (
        <div className="wb-scene__bar" aria-hidden="true">
          <div className="wb-scene__lead">
            <span className="wb-skeleton wb-skeleton--pill" />
            <span className="wb-skeleton wb-skeleton--pill" />
            <span className="wb-skeleton wb-skeleton--pill" />
          </div>
          <span className="wb-skeleton wb-skeleton--btn" />
        </div>
      )}
      {stats > 0 && (
        <div className="wb-stats" aria-hidden="true">
          {Array.from({ length: stats }, (_, i) => (
            <div className="wb-stat" key={i}>
              <span className="wb-skeleton wb-skeleton--label" />
              <span className="wb-skeleton wb-skeleton--figure" />
            </div>
          ))}
        </div>
      )}
      <div className="wb-stack wb-stack--sm" aria-hidden="true">
        {Array.from({ length: rows }, (_, i) => (
          <span className="wb-skeleton wb-skeleton--row" key={i} />
        ))}
      </div>
    </div>
  );
}
