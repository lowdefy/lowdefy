# Error Tracing Test Configs

Test configurations for validating error tracing functionality (Issue #1940). These configs help developers test that errors show proper config location links.

## Build-Time Error Tests (Automated)

**Location:** `packages/build/src/tests/errors/`

End-to-end tests for all build-time errors are automated in `packages/build/src/index.errors.test.js`. Each error type has its own fixture directory with documented YAML files.

Run the tests:

```bash
cd packages/build
pnpm test -- --testPathPattern='index.errors.test.js'
```

### Test Coverage

| Code | Error Type                  | Level                | Test Fixture                       |
| ---- | --------------------------- | -------------------- | ---------------------------------- |
| A1   | Invalid connection type     | Error                | `A1-invalid-connection-type/`      |
| A2   | Missing connection id       | Error                | `A2-missing-connection-id/`        |
| A3   | Duplicate connection id     | Error                | `A3-duplicate-connection-id/`      |
| B1   | Auth config not object      | Error                | `B1-auth-not-object/`              |
| B2   | Auth provider missing id    | Error                | `B2-auth-provider-missing-id/`     |
| B3   | Public/protected conflict   | Error                | `B3-public-protected-conflict/`    |
| B4   | Missing NextAuth secret     | Error                | `B4-missing-nextauth-secret/`      |
| C1   | Duplicate menu id           | Error                | `C1-duplicate-menu-id/`            |
| C2   | Menu link to missing page   | Warn                 | `C2-menu-missing-page/`            |
| D1   | Duplicate page id           | Error                | `D1-duplicate-page-id/`            |
| E1   | Invalid action type         | Error                | `E1-invalid-action-type/`          |
| E2   | Invalid block type          | Error                | `E2-invalid-block-type/`           |
| E3   | Missing block id            | Error                | `E3-missing-block-id/`             |
| E4   | Block id not string         | Error                | `E4-block-id-not-string/`          |
| E5   | Block type not string       | Error                | `E5-block-type-not-string/`        |
| F1   | Invalid request reference   | Warn Dev, Error Prod | `F1-invalid-request-reference/`    |
| F2   | Request missing id          | Error                | `F2-request-missing-id/`           |
| F3   | Duplicate request id        | Error                | `F3-duplicate-request-id/`         |
| F4   | Request id with period      | Error                | `F4-request-id-with-period/`       |
| F5   | Invalid request type        | Error                | `F5-invalid-request-type/`         |
| F6   | Non-existent connectionId   | Error                | `F6-nonexistent-connection/`       |
| F7   | Non-existent connection (ignored) | Suppressed     | `F7-nonexistent-connection-ignored/` |
| G1   | Invalid page link           | Warn Dev, Error Prod | `G1-invalid-page-link/`            |
| G2   | Duplicate action id         | Error                | `G2-duplicate-action-id/`          |
| G3   | Missing action id           | Error                | `G3-missing-action-id/`            |
| G4   | Action type not string      | Error                | `G4-action-type-not-string/`       |
| G5   | Events not array            | Error                | `G5-events-not-array/`             |
| H1   | Operator typo (_staet)      | Warn                 | `H1-operator-typo-state/`          |
| H2   | Operator typo (_iff)        | Warn                 | `H2-operator-typo-if/`             |
| H3   | Operator typo (ignored)     | Suppressed           | `H3-operator-typo-ignored/`        |
| H4   | Action type (ignored)       | Suppressed           | `H4-action-type-ignored/`          |
| H5   | Block type (ignored)        | Suppressed           | `H5-block-type-ignored/`           |
| H6   | Connection type (ignored)   | Suppressed           | `H6-connection-type-ignored/`      |
| H7   | Request type (ignored)      | Suppressed           | `H7-request-type-ignored/`         |
| I1   | Missing \_ref file          | Error                | `I1-missing-ref-file/`             |
| I2   | Circular \_ref              | Error                | `I2-circular-ref/`                 |
| J1   | Undefined state reference   | Warn                 | `J1-undefined-state/`              |
| J2   | Undefined state (ignored)   | Suppressed           | `J2-undefined-state-ignored/`      |
| J3   | Undefined state in request  | Warn                 | `J3-undefined-state-in-request/`   |
| J4   | Undefined state in ref default | Warn              | `J4-undefined-state-in-ref-default/` |
| J5   | State dot-notation child    | Warn                 | `J5-state-dot-notation-child/`     |
| J6   | \_state in request properties | Warn Dev, Error Prod | `J6-state-in-request-properties/`  |
| J7   | \_state in request props (no dup) | Warn Dev, Error Prod | `J7-state-in-request-properties-no-duplicate/` |
| K1   | Undefined payload reference | Warn                 | `K1-undefined-payload/`            |
| K2   | Undefined payload (ignored) | Suppressed           | `K2-undefined-payload-ignored/`    |
| L1   | Undefined step reference    | Warn                 | `L1-undefined-step/`               |
| L2   | Undefined step (ignored)    | Suppressed           | `L2-undefined-step-ignored/`       |
| M1   | \_ref var wrong location    | Error                | `M1-ref-var-wrong-location/`       |
| M2   | \_ref var (ignored)         | Suppressed           | `M2-ref-var-ignored/`              |
| M3   | \_ref nunjucks template     | Error                | `M3-ref-njk-template/`             |
| M4   | \_ref nunjucks (ignored)    | Suppressed           | `M4-ref-njk-ignored/`              |
| N1   | Dedup warnings same page    | Warn                 | `N1-dedup-warnings/`               |
| N2   | Dedup warnings multi-file   | Warn                 | `N2-dedup-multi-file/`             |
| S1   | Ignore all checks           | Suppressed           | `S1-ignore-all-checks/`            |
| S2   | Ignore specific slug        | Suppressed           | `S2-ignore-specific-slug/`         |
| S3   | Ignore inherited            | Suppressed           | `S3-ignore-inherited/`             |
| S4   | Ignore invalid slug         | Error                | `S4-ignore-invalid-slug/`          |
| S5   | Ignore old property migration | Suppressed         | `S5-ignore-old-property-migration/` |
| S6   | Ignore not matching         | Warn                 | `S6-ignore-not-matching/`          |
| S7   | Ignore cascades into \_ref  | Suppressed           | `S7-ignore-cascades-into-ref/`     |
| S8   | Ignore cascades into \_ref array | Suppressed      | `S8-ignore-cascades-into-ref-array/` |
| -    | Multi-file error tracking   | Error                | `multi-file-error/`                |
| -    | Multi-page errors           | Error                | `multi-page-errors/`               |
| -    | Multi-page schema errors    | Error                | `multi-page-schema-errors/`        |
| -    | Multi-validation errors     | Error                | `multi-validation-errors/`         |

Each fixture includes YAML comments documenting the expected error message and line number.

## Runtime Error Tests (Manual)

The following test configs require manual testing with a running dev server.

### Usage

Copy a test file to `app/lowdefy.yaml` and run the dev server:

```bash
cp cc-docs/test-configs/errors/lowdefy-client-errors.yaml app/lowdefy.yaml
pnpm dev
```

### lowdefy-client-errors.yaml

Tests runtime client-side errors during operator parsing. Check browser console (F12) for errors.

| Section | Error Type                                                | How to Test                                      | Implemented     |
| ------- | --------------------------------------------------------- | ------------------------------------------------ | --------------- |
| B1-B3   | Logic operators (`_and`, `_or`, `_if_none`)               | Uncomment blocks - expects array                 | ✓ with location |
| C1-C4   | Math operators (`_sum`, `_product`, `_divide`, `_math.*`) | Uncomment blocks - expects array/number          | ✓ with location |
| D1-D2   | String operators (`_string.*`)                            | Uncomment blocks - invalid method or type        | ✓ with location |
| E1-E2   | Array operators (`_array.*`)                              | Uncomment blocks - invalid method or non-array   | ✓ with location |
| F1-F2   | Object operators (`_object.*`)                            | Uncomment blocks - invalid method or non-object  | ✓ with location |
| G1-G2   | Regex operators (`_regex`)                                | Uncomment blocks - pattern errors                | ✓ with location |
| H1-H2   | Type operators (`_type`)                                  | Uncomment blocks - type errors                   | ✓ with location |
| I1-I2   | Nested operator errors                                    | Uncomment blocks - errors in chains              | ✓ with location |
| J1-J4   | Expression context errors                                 | Uncomment blocks - style/visible/required errors | ✓ with location |
| K1-K4   | Action/event errors                                       | Click buttons - Throw action, operator in params | ✓ with location |
| L1      | Block-level errors                                        | Throw block renders error                        | ✓ with location |

### lowdefy-server-errors.yaml

Tests runtime server-side errors during request execution:

| Error Type                | How to Test                    | Expected Output                          | Implemented     |
| ------------------------- | ------------------------------ | ---------------------------------------- | --------------- |
| HTTP 500                  | Click "Trigger 500" button     | `[Service Error] Http response "500:...` | ✓ no location   |
| HTTP 404                  | Click "Trigger 404" button     | `[Config Error]` with location           | ✓ with location |
| Timeout                   | Click "Trigger Timeout" button | `[Service Error]` network error          | ✓ no location   |
| Operator error in request | Click operator error button    | `[Config Error]` with location           | ✓ with location |
| Transformation error      | Click transform error button   | `[Config Error]` with location           | ✓ with location |

## Error Format

All errors follow this format:

```
[Config Error] <error message>
  <file>:<line> at <config path>
  <absolute path for VSCode click>
```

Example:

```
[Config Error] Action type "NonExistentAction" was used but is not defined.
  pages/home.yaml:25 at root.pages[0:home].blocks[0:button].events.onClick.try[0:action:NonExistentAction]
  /Users/dev/myapp/pages/home.yaml:25
```

## Service vs Config Errors

- **Config Error**: Issue with Lowdefy configuration (shows file location)
- **Service Error**: External service issue like network timeout, HTTP 5xx (no location shown)

## DX Enhancements

### "Did you mean?" Suggestions

Type errors (A1, E1, E2, F5, H1-H2) now include suggestions for similar valid types:

```
[Config Error] Block type "Buton" was used but is not defined. Did you mean "Button"?
  pages/home.yaml:15 at root.pages[0:home].blocks[0:Buton]
```

### Circular Reference Chain Display

Circular `_ref` errors now show the full chain of files:

```
Circular reference detected: fileA.yaml -> fileB.yaml -> fileC.yaml -> fileA.yaml
```
