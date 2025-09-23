<TITLE>
Reset
<TITLE>

<DESCRIPTION>
The `Reset` actions resets a page to the state it was in just after the `onInit` event was executed. This clears the user's inputs.

>  The `Reset` action resets the state to the state after the `onInit` event was executed, and the `onMount` events are not executed after the reset happens. This might cause unexpected behavior if you used an `onInitAsync`, `onMount` or `onMountAsync` event to initialize the state.
<DESCRIPTION>

<USAGE>
```
(void): void
```

The `Reset` action does not take any parameters.
</USAGE>

<EXAMPLES>
### A reset button:
```yaml
- id: reset_button
  type: Button
  properties:
    title: Reset
  events:
    onClick:
      - id: reset
        type: Reset
```
</EXAMPLES>
