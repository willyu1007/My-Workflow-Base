# Publishing & consuming `@willyu1007/web-workbench`

This package ships **built output** (`dist/` = compiled JS + `.d.ts` + CSS). Consumers
install a published release as a normal dependency. A registry install needs no
`transpilePackages`, `preserveSymlinks`, or Turbopack-root widening.

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
   pnpm install --ignore-workspace --frozen-lockfile
   pnpm publish           # prepublishOnly runs tests and the build
   ```

   The kit has its own lockfile and is not a root workspace member. Use
   `--ignore-workspace` so installation follows that committed lockfile.
   `pnpm publish` runs `prepublishOnly` → `pnpm test && pnpm build`, then uploads;
   the build checks tokens, compiles TypeScript, and copies CSS and lint presets.
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
   `insight`, `settings`, `hub`, `queue`, `record`, and `entry`. The root entry remains
   available only as a legacy compatibility barrel.

4. **Remove obsolete local-link configuration** after switching to a registry release.
   Remove `turbopack.root` / `outputFileTracingRoot` overrides in `next.config.mjs`
   and `preserveSymlinks` in `tsconfig.json` only when they existed solely for that link.
   The registry package lives under `node_modules`; its `react`/`next` peers resolve
   to the app's own copies.

## Local development

Use a published release for consumer development, with one UI-kit version per
consumer repository. An unpinned cross-repository `file:` or `link:` dependency is
unsupported. Any local dependency requires an exact upstream revision, logical
source-hash pin evidence, and a consumer CI verifier; it is not release evidence
by itself. Follow the repository's
[Contract distribution](https://github.com/willyu1007/My-Workflow-Base/blob/main/docs/context/ecosystem/contract-distribution.md)
rules rather than adding consumer-specific source or runtime forks.
