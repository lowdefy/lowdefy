<TITLE>
uuid
</TITLE>

<METADATA>
env: Shared
</METADATA>

<DESCRIPTION>
The `_uuid` operator creates [UUIDs](https://en.wikipedia.org/wiki/Universally_unique_identifier). A UUID is a random identifier that is, for all practical purposes, unique. It looks like:

```
123e4567-e89b-12d3-a456-426614174000
```

</DESCRIPTION>

<USAGE>

```
(void): string

###### default:
`_uuid: true`, `_uuid: null` or `_uuid: undefined` returns a version 4 UUID.
```

</USAGE>

<EXAMPLES>
###### Generate a v4 uuid:
```yaml
_uuid: null
```
Returns: A version 4 UUID.
</EXAMPLES>
