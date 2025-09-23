<TITLE>
Wait
<TITLE>

<DESCRIPTION>
The `Wait` waits for the set number of milliseconds before returning.
<DESCRIPTION>

<USAGE>
```
(params: {
  ms: integer,
}): void
```

###### object
- `ms: integer`: __Required__ - The number of milliseconds to wait.
</USAGE>

<EXAMPLES>
### Wait for 500 milliseconds:
```yaml
- id: wait
  type: Wait
  params:
    ms: 500
```
</EXAMPLES>
