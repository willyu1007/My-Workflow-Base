# Pitfalls

| Recurring mistake or hazardous action | Evidence | Prevention | Remove when |
|---|---|---|---|
| Treating a declared token as proof it governs UI | Earlier drift existed despite nearby token-like values. | Trace source → generated CSS → consumed class/component → rendered usage. | Tooling validates the complete consumption chain. |
| Fixing a kit defect with a host override | Consumer-specific overrides fork the design system. | Assign owner first and repair kit-owned behavior upstream. | Hosts cannot override locked kit chrome. |
| Using `transition: all` or incomplete reduced-motion rules | Prior sidebar/filter defects bypassed intended constraints. | Lint broad transitions and cover both animation and transition in reduced motion. | Platform primitives make the invalid forms unreachable. |
| Expanding tests by component count | Most stateless components need no behavior harness. | Add focused tests when state or interaction appears. | The component testing policy changes. |
