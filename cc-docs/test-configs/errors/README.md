# Error Tracing Test Configs

Test configurations for validating error tracing functionality (Issue #1940). These configs help developers test that errors show proper config location links.

## Usage

Copy one of these files to `app/lowdefy.yaml` and run the dev server:

```bash
cp cc-docs/test-configs/errors/lowdefy-build-errors.yaml app/lowdefy.yaml
pnpm dev
```

## Test Files

### Multi-File Error Tracing Test

**Location:** `cc-docs/test-configs/errors/multi-file-refs/`

Tests that errors in `_ref` imported files show the **correct source file path** (not the parent file path).

**Issue #1947:** Before the fix, errors in child files showed the parent file path with child file line numbers. For example:
- ❌ **Before:** `lowdefy.yaml:184` (wrong file, correct line)
- ✅ **After:** `pages/product-details.yaml:184` (correct file and line)

See `cc-docs/test-configs/errors/multi-file-refs/README.md` for detailed testing instructions.

### lowdefy-build-errors.yaml

Tests build-time errors that fail the build (prod) or warn (dev). Uncomment one error section at a time.

| Section | Error Type                | Expected Output                                                       | Level                | Implemented          |
| ------- | ------------------------- | --------------------------------------------------------------------- | -------------------- | -------------------- |
| A1      | Invalid connection type   | `Connection type "NonExistentConnection" was used but is not defined` | Error                | ✓ with location      |
| A2      | Missing connection id     | `Connection id missing`                                               | Error                | ✓ with location      |
| A3      | Duplicate connection id   | `Duplicate connectionId "testApi"`                                    | Error                | ✓ with location      |
| B1      | Auth config not object    | `lowdefy.auth is not an object`                                       | Error                | ✓ with location      |
| B2      | Auth provider missing id  | `Auth provider id missing`                                            | Error                | ✓ with location      |
| B3      | Public/protected conflict | `Protected and public pages are mutually exclusive`                   | Error                | ✓ with location      |
| C1      | Duplicate menu id         | `Duplicate menuId "default"`                                          | Error                | ✓ with location      |
| C2      | Menu link to missing page | `Page "nonExistentPage" referenced in menu link not found`            | Warn                 | ✓ with location      |
| D1      | Duplicate page id         | `Duplicate pageId "home"`                                             | Error                | ✓ with location      |
| E1      | Invalid action type       | `Action type "NonExistentAction" was used but is not defined`         | Error                | ✓ with location      |
| E2      | Invalid block type        | `Block type "NonExistentBlockType" was used but is not defined`       | Error                | ✓ with location      |
| E3      | Missing block id          | `Block id missing at page "home"`                                     | Error                | ✓ with location      |
| E4      | Block id not string       | `Block id is not a string at page "home"`                             | Error                | ✓ with location      |
| E5      | Block type not string     | `Block type is not a string`                                          | Error                | ✓ with location      |
| F1      | Invalid request reference | `Request "nonExistentRequest" not defined on page "home"`             | Warn Dev, Error Prod | ✓ with location      |
| F2      | Request missing id        | `Request id missing at page "home"`                                   | Error                | ✓ with location      |
| F3      | Duplicate request id      | `Duplicate requestId "myRequest" on page "home"`                      | Error                | ✓ with location      |
| F4      | Request id with period    | `Request id "my.request" should not include a period`                 | Error                | ✓ with location      |
| F5      | Invalid request type      | `Request type "NonExistentRequestType" was used but is not defined`   | Error                | ✓ with location      |
| F6      | Non-existent connectionId | `Request references non-existent connection`                          | Error                | ✓ with location      |
| G1      | Invalid page link         | `Page "nonExistentPage" not found`                                    | Warn Dev, Error Prod | ✓ with location      |
| G2      | Duplicate action id       | `Duplicate actionId "linkAction"`                                     | Error                | ✓ with location      |
| G3      | Missing action id         | `Action id missing on event "onClick"`                                | Error                | ✓ with location      |
| G4      | Action type not string    | `Action type is not a string`                                         | Error                | ✓ with location      |
| G5      | Events not array          | `Actions must be an array`                                            | Error                | ✓ with location      |
| H1-H2   | Operator typo             | `Operator type "_staet" was used but is not defined. Did you mean?`   | Warn                 | ✓ with location      |
| I1      | Missing \_ref file        | `Tried to reference file "nonexistent.yaml" but file does not exist`  | Error                | ✓ with location      |
| I2      | Circular \_ref            | `Circular reference detected: a.yaml -> b.yaml -> a.yaml`             | Error                | ✓ with chain         |
| J1      | Undefined state reference | `_state references "key" but no input block with this id exists`      | Warn                 | ✓ with location      |
| K1      | Undefined payload reference | `_payload references "key" but no key exists in payload definition` | Warn                 | ✓ with location      |
| L1      | Undefined step reference | `_step references "stepId" but no step with this id exists in routine` | Warn                 | ✓ with location      |

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
