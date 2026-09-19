# Verification

## Evidence

| Claim / reference | Check / procedure | Latest result | Evidence / limitation |
|---|---|---|---|
| Slots render brand, scene, heading, actions, and choices | Kit structure tests in `tests/entry-frame.test.tsx` | passed | Node 25.3.0; full suite 9 files / 83 tests |
| Accessory is absent until supplied | Same suite | passed | Same run |
| Scene primary action is unchanged | Review `.wb-action--primary` and entry CSS selectors | passed | Entry actions are `.wb-entry__action*` only |
| Package source compiles | `pnpm exec tsc --noEmit -p tsconfig.build.json` | passed | 2026-09-19; `tsconfig.json` still reports a pre-existing `node:fs` test typing gap |
| No texture or scenario names in the new module | Source review of entry component/CSS | passed | Flat `--mt-navy-700`; scene label is a slot |
| Consumer unsigned gate | Nurture `/entry` in the browser against a local `link:` | passed | 200; `MORETHAN \| 托育`, 登录工作台, orange 登录; `?signout=local` shows the status notice. CJK in screenshots is unreliable. |
| Publish `0.22.0` | `pnpm publish` then `pnpm view` | passed | Registry latest is `0.22.0` |
| Consumer registry pin | Nurture `@willyu1007/web-workbench` `0.22.0` (exact) + lockfile tarball | passed | Frontend typecheck, entry CSS lint, and 21 related tests passed. `/entry?reason=sign_in` and `?signout=local` return 200 with `wb-entry__brand` / `MORETHAN | 托育`. Install swap caused a brief Next resolve 500, then compiled. |
| Sibling source-hash pin | `pnpm reseal:pins apply --allow-base-move` then `verify:workflow-contract-pin` | passed | Sealed to the current Base HEAD; `web_workbench` sha256 `93e79e890067…`. The same reseal also moved My-Chat HEAD (`467339cc` → `7168a9da`, revision only) and reminted the Nurture scenario hash for the 0.22.0 lockfile. |
| Consumer signed-in gate | Nurture `/entry` after 以测试园长进入 against registry `0.22.0` | passed | 200; `MORETHAN \| 托育`, heading `正在进入`, aside `测试园长 · 开发测试园`, `进入`. Auto-enter then reached `/nurture/overview`. |
| Consumer unavailable gate | Same session after stopping My-Chat `:8001`, then retry after restart | passed | `/entry` showed `暂时无法进入` with `重试`, ghost `登录`, and quiet `退出登录`. After API restart, `/entry?retry=1` returned to `正在进入`. |
| Scene sign-out stays off EntrySubmit | `/nurture/account` after the closeout fix | passed | Button is `wb-action` `type=submit`, not inside `.wb-entry`. |
| Single-role frame keeps sign-out | Entry markup test plus signed-in `/entry` | passed | `server.test.ts` asserts `正在进入` + `退出登录`; browser snapshot showed both before auto-enter. |

## Outstanding verification

- Kit vitest on Node 20 still fails to start jsdom 30; publish used Node 25.
