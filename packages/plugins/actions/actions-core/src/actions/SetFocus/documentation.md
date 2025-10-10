<TITLE>
SetFocus
<TITLE>

<DESCRIPTION>
This action implements the [HTMLElement.focus()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) method.

The `SetFocus` action sets focus on the specified HTML element, provided it can receive focus. It takes an id of the HTML element as a parameter.
By default, when focusing an element, the browser will scroll it into view and may provide visible indication of the focus, typically by displaying a "focus ring" around the element.

Note that for blocks like `TextInput`, the id of the HTML input element is not equal to the block id, since the block includes other HTML elements like the label, extra text and icons. You can inspect the HTML elements in the browser to find the correct element id.
<DESCRIPTION>

<USAGE>
```
(params: string): void
```

###### string
String that is the ID of the HTML element to focus.
</USAGE>

<EXAMPLES>
### Set a TextInput block in focus when another TextInput's value changes:
```yaml
- id: text_input_1
  type: TextInput
  events:
    onChange:
      - id: set_focus
        type: SetFocus
        # Note that the params is an HTML element ID, and not a Block ID.
        params: text_input_2_input
- id: text_input_2
  type: TextInput
```
</EXAMPLES>
