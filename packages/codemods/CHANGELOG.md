# @lowdefy/codemods

## 5.5.1

## 5.5.0

### Minor Changes

- 9c93ab2: feat: Port MongoDB community plugin features into @lowdefy/connection-mongodb.

  All features of `@lowdefy/community-plugin-mongodb` are now part of the core MongoDB connection, so apps can drop the community plugin.

  **Change log auditing**

  - New `changeLog` connection property (`collection`, `meta`). All write requests log a change record — request arguments, request context, timestamp, and either the driver response or before/after document snapshots (`MongoDBUpdateOne`, `MongoDBVersionedUpdateOne`, `MongoDBDeleteOne`) — to the log collection. Response shapes are the same with or without a log collection.

  **MongoDBUpdateOne no-match error (behavior change)**

  - `MongoDBUpdateOne` now throws `No matching record to update.` when no document matches the filter and `upsert` is not set. Set `disableNoMatchError: true` on the request to keep the previous silent behavior. Running `lowdefy upgrade` applies a codemod that adds the flag to existing requests, so upgraded apps behave exactly as before. Apps already using the community plugin are unaffected.

  **New requests**

  - `MongoDBVersionedUpdateOne`: updates a document while preserving the previous version as a copy under a new `_id`.
  - `MongoDBInsertConsecutiveId` and `MongoDBInsertManyConsecutiveIds`: insert documents with sequential human-readable ids (for example `INV0001`), assigned inside a transaction (requires a replica set). Also fixes a community plugin bug where the id lookup ran outside the transaction.

  **New auth adapter**

  - `MultiAppMongoDBAdapter`: next-auth adapter for multiple apps sharing one `user-contacts` collection, with per-app membership, roles, and an invite-required sign up flow.

  `MongoDBInsertMany` now also returns `insertedIds`, matching the community plugin response.

## 5.4.0

## 5.3.0

## 5.2.0

## 5.1.0

## 5.0.0

### Minor Changes

- deac108c66: feat: Add `lowdefy upgrade` command with prompt-based codemod system

  New CLI command that guides version migrations using markdown prompts. Resolves a chain of upgrade phases from current to target version, presents migration prompts in order, and tracks progress for `--resume` support.

  **CLI (`lowdefy`)**

  - `lowdefy upgrade` command with `--to`, `--plan`, `--resume` options
  - Version chain resolver computes ordered upgrade phases from semver ranges
  - Fetches `@lowdefy/codemods` package from npm, presents migration prompts
  - Each prompt can be copied to clipboard for AI tools, viewed as a manual guide, or skipped
  - Upgrade state persistence in `.lowdefy/upgrade-state.json` for interrupted upgrades
  - Build-time warning when skipped codemods are detected

  **Codemods (`@lowdefy/codemods`)**

  - v5.0 entry with 20 migration prompts
  - Covers antd v6 upgrade (14 prompts), layout grid migration (4 prompts), dayjs migration (2 prompts)
  - Self-contained markdown prompts with context, examples, edge cases, and verification steps
