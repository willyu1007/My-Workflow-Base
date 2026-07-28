# Publishing & consuming `@willyu1007/web-workbench`

This package ships **built output** (`dist/` = compiled JS + `.d.ts` + CSS). Consumers
treat it as a normal dependency — no `transpilePackages`, no `preserveSymlinks`, no
Turbopack-root widening. Those hacks only exist while consuming the package via a local
cross-repo `link:` (see "Local dev" at the bottom).

Target registry: **GitHub Packages** (`https://npm.pkg.github.com`), scope `@willyu1007`.
Package visibility: **public**. The package was changed to public with owner
approval on 2026-07-28 so unrelated public scenario repositories can resolve
the exact release with their own repository-scoped `GITHUB_TOKEN`. GitHub does
not support changing a public package back to private.

## Publish (you must run this — it needs your GitHub auth)

1. **Create a token** with `write:packages` scope: GitHub → Settings → Developer settings →
   Personal access tokens (classic).

2. **Authenticate** — add to `~/.npmrc` (global, not committed):

   ```
   //npm.pkg.github.com/:_authToken=YOUR_TOKEN
   @willyu1007:registry=https://npm.pkg.github.com
   ```

3. **Build + publish** from `templates/web-workbench`:

   ```bash
   pnpm install          # first time, to get react/next types for the build
   pnpm publish           # prepublishOnly runs the build automatically
   ```

   `pnpm publish` runs `prepublishOnly` → `pnpm build` (tsc → dist + copy CSS), then uploads.
   Before publishing, verify that `publishConfig.access` remains `public`;
   `restricted` no longer matches the package's irreversible visibility or its
   cross-repository distribution contract.

4. **New versions**: bump `version` in package.json, then `pnpm publish` again.

## Consume from the registry (The-Education and any other project)

1. **Auth + scope** — GitHub Packages still requires authenticated downloads
   for public npm packages. Each consuming repo needs an `.npmrc` (the auth
   line can live in the global `~/.npmrc` instead, so no token is committed):

   ```
   @willyu1007:registry=https://npm.pkg.github.com
   ```

   In GitHub Actions, use that repository's own `GITHUB_TOKEN` with
   `packages: read`; do not share a cross-repository PAT merely to read this
   public package.

2. **Add the dependency**:

   ```bash
   pnpm add @willyu1007/web-workbench@^0.7.0
   ```

3. **Import styles once** at the app root and use the components:

   ```ts
   import "@willyu1007/web-workbench/styles/index.css";
   import { InsightCard, type InsightModel } from "@willyu1007/web-workbench/insight";
   ```

   Prefer grouped entries for new code: `primitives`, `shell`, `feedback`, `list`,
   `insight`, `settings`, `hub`, `queue`, and `record`. The root entry remains
   available only as a legacy compatibility barrel.

4. **Remove the local-dev hacks** (they are only needed for the `link:` setup):
   - `next.config.mjs`: delete the `turbopack.root` / `outputFileTracingRoot` block.
   - `tsconfig.json`: delete `"preserveSymlinks": true`.

   With a registry install the package's files live under `node_modules` normally and its
   `react`/`next` peer deps resolve to the app's own copies — zero config.

## Local dev (current The-Education setup, pre-publish)

Before publishing, The-Education consumes the package via a cross-repo `link:` to this
folder, resolving the built `dist`. Because the symlink's realpath is in a sibling repo:
- `next.config.mjs` widens the Turbopack/tracing root so the symlink resolves.
- `tsconfig.json` sets `preserveSymlinks` so tsc resolves the package's React to the app's.
- After editing the package, run `pnpm build` here so the linked `dist` updates.

Switch to the registry dependency (above) to drop all three.
