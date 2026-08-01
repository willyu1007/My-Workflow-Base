# Consumer skills

Agent skills for projects that **consume** `@willyu1007/web-workbench`. They are
not part of the published package — copy them into the consuming repository.

```bash
cp -R templates/web-workbench/skills/audit-workbench-motion \
      <consumer-repo>/.claude/skills/features/ui/
```

| Skill | Does |
| --- | --- |
| `audit-workbench-motion` | Read-only web motion review / discovery / audit for a kit-consuming app. Triages every finding by owner (host vs kit) first, so consumer-side work stays consumer-side and kit problems route upstream instead of becoming host overrides. |

## Why these live here and not in the tarball

A skill has to sit under the consuming repo's `.claude/skills/` to be
discoverable, so shipping it inside `node_modules` would not make it reachable.
The *contracts* it cites do ship (0.12.1+), which is what lets a copied skill
point at `node_modules/@willyu1007/web-workbench/MOTION.md` and read the rules
for the version that project actually installed.

## Relationship to the platform host's UI skills

My-Chat carries the platform-wide set (`audit-ui-motion`,
`validate-ui-typography`, `pick-web-ui-library`, plus the `data-ui` system
skills). Those govern that repo's own Web/Admin/React Native surfaces under the
`data-ui` + Tailwind-B1 system, and their authority chain is
`docs/context/ui/*`.

A kit consumer is on a different chain — its authority is the kit's contracts —
so the skills here are the workbench-side counterpart, not a copy. Web only: a
consumer of this kit has no native surface. If a project has both systems live,
keep the two authority chains separate; a screen belongs to one or the other.
