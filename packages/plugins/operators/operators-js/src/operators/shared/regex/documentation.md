<TITLE>_regex</TITLE>
<METADATA>env: Shared</METADATA>
<DESCRIPTION>The `_regex` operator performs a regex test on a string, and returns `true` if there is a match.

The regex operator has shorthand argument definitions that can be used on web client.</DESCRIPTION>
<USAGE>(pattern: string): boolean
(arguments: {
pattern: string,
on?: string,
key?: string,
flags?: string
}): boolean

###### object

- `pattern: string`: **Required** - The regular expression pattern to test.
- `on: string`: The string to test the value on. One of `on` or `key` must be specified unless the operator is used in an input block.
- `key: string`: The key of a value in `state` to test. One of `on` or `key` must be specified unless the operator is used in an input block.
- `flags: string`: The regex flags to use. The default value is `"gm"`.

###### string

The regular expression pattern to test. The string shorthand can only be used in an input block, and the tested value will be the block's value.</USAGE>
<EXAMPLES>###### Check if a username is valid (Alphanumeric string that may include \_ and – having a length of 3 to 16 characters):

```yaml
_regex:
  pattern: ^[a-z0-9_-]{3,16}$
  on:
    _state: username_input
```

Returns: `true` if matched else `false`.

###### Using the key of the value in `state`:

```yaml
_regex:
  pattern: ^[a-z0-9_-]{3,16}$
  key: username_input
```

Returns: `true` if matched else `false`.

###### Using the value of the block in which the operator is evaluated:

```yaml
id: username_input
type: TextInput
validate:
  - message: Invalid username.
    status: error
    pass:
      _regex: ^[a-z0-9_-]{3,16}$
```

Returns: `true` if matched else `false`.

###### Case insensitive match:

```yaml
_regex:
  pattern: ^[a-z0-9_-]{3,16}$
  on:
    _state: username_input
  flags: 'gmi'
```

Returns: `true` if matched else `false`.</EXAMPLES>
