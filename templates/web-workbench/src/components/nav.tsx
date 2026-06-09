/**
 * nav.tsx — the ONLY framework touchpoint in this kit.
 *
 * Every component routes through these three exports instead of importing a
 * router directly. To port the kit off Next.js (to Vite + react-router, Remix,
 * TanStack Router, …), reimplement just this file — the rest of the kit is
 * framework-agnostic.
 */
"use client";

import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";

/** Client-side link. Swap to your router's link component when porting. */
export const Link = NextLink;

/** Active-route predicate for nav highlighting (exact or path-prefix match). */
export function useActiveRoute(): (href: string) => boolean {
  const pathname = usePathname();
  return (href) => pathname === href || pathname.startsWith(`${href}/`);
}

/** Imperative navigate, e.g. whole-row click → detail. */
export function useNavigate(): (href: string) => void {
  const router = useRouter();
  return (href) => router.push(href);
}
