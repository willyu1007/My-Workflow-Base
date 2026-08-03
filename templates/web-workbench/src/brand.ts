/* GENERATED FILE. DO NOT EDIT BY HAND.
 * Source: tokens/base.json  ·  Emitter: tokens/emit.mjs
 *
 * Brand colors for the few contexts that cannot hold a CSS variable — a Next
 * viewport themeColor, a web-app manifest, an email template. Everything that
 * CAN take a var() must: see GOVERNANCE.md.
 */
export const brand = {
  /** --mt-cream */
  canvas: "#FBF7F1",
  /** --mt-paper */
  surface: "#FFFFFF",
  /** --mt-ink */
  ink: "#111827",
  /** --mt-navy */
  navy: "#283E68",
  /** --mt-orange */
  orange: "#E1703C",
} as const;

export type BrandColor = keyof typeof brand;
