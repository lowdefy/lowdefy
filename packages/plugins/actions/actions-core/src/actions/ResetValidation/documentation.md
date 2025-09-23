<TITLE>
ResetValidation
<TITLE>

<DESCRIPTION>
The `ResetValidation` action is used to reset validation flags on input fields.

By default when a page is opened, no validation flags are set on any input fields. When the `Validate` is called, a validation flag is set on input fields matching the validation params. To reset the validation flags, use the `ResetValidation` action.

The `ResetValidation` action `blockIds` or `regex` params are used to limit which blocks validation errors and warnings should be reset.
<DESCRIPTION>

<USAGE>
```
(void): void
(blockId: string): void
(blockIds: string[]): void
(params: {
  blockId?: string|string[],
  regex?: string|string[],
}): void
```

###### void
The `ResetValidation` action lowers validation flags on all blocks on the page if called without params.

###### string
A blockId of the block for which to lower validation flags.

###### string[]
An array of blockIds of the blocks for which to lower validation flags.

###### object
- `blockId?: string|string[]`: A blockId or an array of the blockIds of the blocks for which to lower validation flags
- `regex?: string|string[]`: A regex string pattern or an array of regex string patterns to match the blockIds for which to lower validation flags.
</USAGE>

<EXAMPLES>
### Lower validation flags for all inputs on the page:
```yaml
- id: reset_all
  type: ResetValidation
```

### Lower validation flags for a single input:
```yaml
- id: reset_my_input
  type: ResetValidation
  params: my_input
```

### Lower validation flags for a list of inputs:
```yaml
- id: reset_input_a_and_b
  type: ResetValidation
  params:
    - my_input_a
    - my_input_b
```

### Lower validation flags for all inputs matching a regex pattern:
```yaml
- id: reset_foo
  type: ResetValidation
  params:
    regex: ^foo\.
```

### Lower validation flags for all inputs matching a list of regex patterns:
```yaml
- id: reset_foo_and_price
  type: ResetValidation
  params:
    regex:
      - ^foo\.
      - ^.*price.*$
```

### Lower validation flags for all inputs matching a list of regex patterns and a blockId:
```yaml
- id: reset_foo_price_and_my_input
  type: ResetValidation
  params:
    blockId: my_input
    regex:
      - ^foo\.
      - ^.*price.*$
```
</EXAMPLES>
