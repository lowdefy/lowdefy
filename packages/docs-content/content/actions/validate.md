# Validate

```
(void): void
(blockId: string): void
(blockIds: string[]): void
(blockIds: string[]): void
(params: {
  blockIds?: string|string[],
  regex?: string|string[],
  schema?: boolean|string,
}): void
```

The `Validate` action is used to validate a users input, usually before information is inserted into a database using a request.
It is used in conjunction with the `required` and `validate` fields on input blocks. If the validation fails, the `Validate` action will fail, and this will stop the execution of actions that are defined after it.

The first time a `Validate` action is called, validation errors and warnings are shown to the user. The [`Reset`](/Reset) action resets the validation status and the page `state`. The [`ResetValidation`](/ResetValidation) action resets only the validation status.

The `Validate` action `blockIds` or `regex` params are used to limit which blocks are validated. Only the matched blocks will be validated, and validation results are shown for only those matched blocks.

When the page declares a [state contract](/page-and-app-state#state-contract), the `schema` param validates the page `state` against it: `schema: true` checks the whole contract, and a dotted state path checks only the fragment declared at that path. The schema check runs in addition to the blocks selected by `blockIds` or `regex`, so `{ blockIds: [...], schema: true }` does both. A violation at a path that is a block on the page is shown on that block; the rest are reported in the error message as `state.<path>: <message>` lines.

#### Parameters

###### void
The `Validate` action validates all blocks on the page if called without params.

###### string
A blockId of the block to validate.

###### string[]
An array of blockIds of the blocks to validate.

###### object
  - `blockIds?: string|string[]`: A blockId or an array of the blockIds of the blocks to validate.
  - `regex?: string|string[]`: A regex string pattern or an array of regex string patterns to match the blockIds to validate.
  - `schema?: boolean|string`: Validate the page `state` against the page's declared `state` contract. `true` validates the whole contract; a dotted state path validates the fragment declared at that path. Runs in addition to the blocks matched by `blockIds` or `regex`.

#### Examples

###### Validate all inputs on the page:
```yaml
- id: validate_all
  type: Validate
```

###### Validate a single input:
```yaml
- id: validate_my_input
  type: Validate
  params: my_input
```

###### Validate a list of inputs:
```yaml
- id: validate_input_a_and_b
  type: Validate
  params:
    - my_input_a
    - my_input_b
```

###### Validate the page state against the declared state contract:
```yaml
- id: validate_contract
  type: Validate
  params:
    schema: true
```

###### Validate the required inputs and one fragment of the state contract:
```yaml
- id: validate_address
  type: Validate
  params:
    blockIds:
      - data.address.formatted_address
    schema: data.address
```

###### Validate all inputs matching a regex pattern:
```yaml
- id: validate_foo
  type: Validate
  params:
    regex: ^foo\.
```

###### Validate all inputs matching a list of regex patterns:
```yaml
- id: validate_foo_and_price
  type: Validate
  params:
    regex:
      - ^foo\.
      - ^.*price.*$
```

###### Validate all inputs matching a list of regex patterns and a blockId:
```yaml
- id: validate_foo_price_and_my_input
  type: Validate
  params:
    blockId: my_input
    regex:
      - ^foo\.
      - ^.*price.*$
```
