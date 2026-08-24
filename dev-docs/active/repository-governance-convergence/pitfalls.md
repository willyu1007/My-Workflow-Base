# Pitfalls

| Recurring mistake or hazardous action | Evidence | Prevention | Remove when |
|---|---|---|---|
| Treating the legacy CLI as an ID allocator | Its command surface only supports legacy sync and lint. | Use the frozen one-time identity ledger, then let the new CLI own future allocation. | The legacy checkpoint no longer needs to be interpreted operationally. |
| Committing both hub layouts | Installer refresh initializes the flat hub but does not delete `main/`. | Make old-hub deletion part of the same validated cutover. | The legacy paths no longer exist in reachable maintained branches. |
| Shipping a Starter task identity | The old generator copied `templates/scenario-module/dev-docs` verbatim. | Keep task creation in the consuming repository and exclude `dev-docs` at both generation and package-staging boundaries. | Starter generation has a dedicated consumer-governance handshake. |
| Expanding skill removal into UI redesign | The only intended UI product change is removal of a copyable project skill. | Exclude token values, CSS, components, motion, interaction, and tests from visual changes; portability fixes stay in tooling. | Not applicable while this migration remains active. |
