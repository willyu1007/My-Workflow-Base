# Scenario integration roadmap

## Goal

Register `{{SCENARIO_KEY}}` through the public Base contract and My-Chat Host SDK without
adding a Host special case or copying platform facts into this repository.

## Milestones

1. Replace example domain names while preserving the generated owner boundary.
2. Define scenario-owned authorization, facts, presenter reads, and deletion.
3. Qualify the independent Prisma migration and atomic owner outbox.
4. Pin exact Base, Host SDK, and scenario artifact identities.
5. Register a default-disabled release and run Admin dry-run.
6. Make an independent product activation decision.

## Release rule

Qualification does not enable traffic. Activation stays `disabled` until its
separate product, privacy, compliance, and rollout decision is approved.
