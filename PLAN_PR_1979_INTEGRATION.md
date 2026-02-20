# Plan: Integrate PR #1979 Plugin Schema Validation

## Context

PR #1979 (`plugins-validation-server`) adds server-side plugin schema validation. It has 30 interleaved commits touching 93 files with two distinct concerns:

- **Category A — Schema definitions + build-time generation**: New schema files for plugins and build-time code to write schema maps. Almost entirely new files with no conflict risk.
- **Category B — Runtime error validation**: Validates plugin params against schemas at runtime, converts schema mismatches to `ConfigError`. Heavily conflicts with the error refactor in PR #2014.

PR #2014 (`issue-2002-errors-cleanup`) is a major refactor of the error system. Category B must be redesigned against the new error classes and interface layers.

## Step 1: Merge PR #2014

Finish and merge the current errors cleanup branch.

- [ ] Commit remaining uncommitted changes on `issue-2002-errors-cleanup`
- [ ] Open / update PR #2014 targeting `develop`
- [ ] Review, merge

## Step 2: New branch — extract Category A (schema definitions)

Create a new branch from `develop` (after PR #2014 is merged) and bring in the schema definition work from PR #1979 using file-level checkout. These are mostly new files so no conflict resolution needed.

### Files to extract

**Action schemas** (all new files):

```
packages/plugins/actions/actions-core/src/actions/CallAPI/schema.js
packages/plugins/actions/actions-core/src/actions/CallMethod/schema.js
packages/plugins/actions/actions-core/src/actions/CopyToClipboard/schema.js
packages/plugins/actions/actions-core/src/actions/DisplayMessage/schema.js
packages/plugins/actions/actions-core/src/actions/Fetch/schema.js
packages/plugins/actions/actions-core/src/actions/GeolocationCurrentPosition/schema.js
packages/plugins/actions/actions-core/src/actions/Link/schema.js
packages/plugins/actions/actions-core/src/actions/Login/schema.js
packages/plugins/actions/actions-core/src/actions/Logout/schema.js
packages/plugins/actions/actions-core/src/actions/Request/schema.js
packages/plugins/actions/actions-core/src/actions/Reset/schema.js
packages/plugins/actions/actions-core/src/actions/ResetValidation/schema.js
packages/plugins/actions/actions-core/src/actions/ScrollTo/schema.js
packages/plugins/actions/actions-core/src/actions/SetFocus/schema.js
packages/plugins/actions/actions-core/src/actions/SetGlobal/schema.js
packages/plugins/actions/actions-core/src/actions/SetState/schema.js
packages/plugins/actions/actions-core/src/actions/Throw/schema.js
packages/plugins/actions/actions-core/src/actions/UpdateSession/schema.js
packages/plugins/actions/actions-core/src/actions/Validate/schema.js
packages/plugins/actions/actions-core/src/actions/Wait/schema.js
packages/plugins/actions/actions-core/src/schemas.js
```

**Build — schema map writers** (all new files):

```
packages/build/src/build/writePluginImports/writeActionSchemaMap.js
packages/build/src/build/writePluginImports/writeActionSchemaMap.test.js
packages/build/src/build/writePluginImports/writeBlockSchemaMap.js
packages/build/src/build/writePluginImports/writeBlockSchemaMap.test.js
packages/build/src/build/writePluginImports/writeOperatorSchemaMap.js
packages/build/src/build/writePluginImports/writeOperatorSchemaMap.test.js
packages/build/src/defaultTypesMap.js
```

**Files to review before extracting** (existing files modified by PR #1979):

```
packages/build/src/build/writePluginImports/writePluginImports.js  # adds schema map calls
packages/build/src/build/jit/shallowBuild.js                       # adds schema to JIT
packages/plugins/actions/actions-core/src/actions.js                # restructured exports
packages/plugins/actions/actions-core/package.json                  # added dep
packages/plugins/actions/actions-pdf-make/src/actions.js            # minor change
packages/plugins/actions/actions-pdf-make/package.json              # added dep
```

### Extraction method

```bash
git fetch origin plugins-validation-server
git checkout -b feat/plugin-schemas develop

# Grab new files directly from the PR branch
git checkout origin/plugins-validation-server -- <new-files-list>

# For modified files, manually review and apply changes
# (writePluginImports.js, shallowBuild.js, actions.js, package.json files)
```

### Review checklist for Category A

- [ ] Check that schema files follow project conventions (license headers, formatting)
- [ ] Verify `writePluginImports.js` changes integrate cleanly with current `develop`
- [ ] Run build and tests for affected packages
- [ ] Commit and open PR

## Step 3: Extract a spec from Category B (runtime validation)

Read through PR #1979's Category B changes to understand the intended behavior, then document as a spec. Do NOT port the code — the error system has changed.

### Category B files to study

**API layer — error logging with validation:**

```
packages/api/src/routes/log/logClientError.js           # major changes (+103/-12)
packages/api/src/routes/log/logClientError.test.js       # major changes (+601/-37)
packages/api/src/routes/log/formatValidationError.js     # new file
packages/api/src/routes/log/formatValidationError.test.js # new file
packages/api/src/routes/log/validatePluginSchema.js      # new file
packages/api/src/routes/log/validatePluginSchema.test.js # new file
packages/api/src/routes/request/validateSchemas.js       # modified (+34/-7)
packages/api/src/routes/request/validateSchemas.test.js  # new file
packages/api/src/context/createEvaluateOperators.js      # modified
```

**Client layer — error reporting:**

```
packages/client/src/block/Block.js        # modified
packages/client/src/createLogError.js     # modified (+15/-11)
packages/client/src/request.js            # modified
```

**Engine:**

```
packages/engine/src/Actions.js            # modified
```

### Key questions for the spec

- What triggers schema validation? (On error? On every request? Both?)
- What does `validatePluginSchema` check? (Ajv against the schema map from build?)
- When schema validation fails, what happens? (Convert to `ConfigError`? What message?)
- When schema validation passes, what happens? (Keep original error type?)
- How does this work for client-reported errors vs server-side request errors?
- How are the schema maps loaded at runtime? (Imported from build artifacts?)
- What is `formatValidationError` doing? (Human-readable Ajv error messages?)

### Spec deliverable

Write a spec document covering:

1. **Goal**: Why validate plugin params against schemas on error
2. **Flow**: Where validation runs in the request/error lifecycle
3. **Schema loading**: How build-time schema maps are available at runtime
4. **Validation logic**: What happens on pass vs fail
5. **Error conversion**: How schema failures become `ConfigError` with the new error classes
6. **Client vs server**: Differences in the two paths

## Step 4: Implement Category B from scratch

With the spec in hand, implement runtime schema validation against the new error system from PR #2014.

### Advantages of reimplementing

- Error classes now have typed subclasses (`ActionError`, `OperatorError`, etc.) with cause chains
- Interface layers already have clean catch points for adding validation
- `configKey` propagation is standardized — validation errors can leverage this
- No need to fight merge conflicts across 15+ files

### Implementation approach

- Add schema validation as a step in the existing interface layer catch blocks
- When a plugin error occurs AND the params fail schema validation → wrap as `ConfigError`
- When params pass schema validation → keep the original typed error (plugin bug, not config)
- Reuse `formatValidationError` concept for human-readable Ajv messages
- Write tests against the new error class behavior

### Packages to modify

1. `@lowdefy/api` — add `validatePluginSchema`, integrate into error logging and request handling
2. `@lowdefy/client` — update error reporting to include schema validation results
3. `@lowdefy/engine` — if needed for action error handling

## Notes

- PR #1979 had an unresolved issue where "errors are logged before onMount completes" — check if PR #2014 already addresses this
- The `cleanup` command added in PR #1979 is orthogonal — can be brought in separately if useful
