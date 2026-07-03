---
'@lowdefy/blocks-antd': minor
---

Label and input blocks no longer show an unwanted browser tooltip duplicating the label, which previously leaked raw HTML markup on hover when the label title contained HTML.

Tooltips are now opt-in via a new `tooltip` label property, which shows an icon beside the label with an accessible Ant Design tooltip. It accepts either a string (the tooltip text, supports HTML) or an object to also customize the icon and color:

```yaml
label:
  tooltip:
    title: More information # supports HTML
    icon: AiOutlineInfoCircle # defaults to AiOutlineQuestionCircle
    color: '#1677ff'
```

A new `onTooltipClick` event fires when the tooltip icon is clicked. This applies to the `Label` block and all label-based inputs (ButtonSelector, Selector, CheckboxSelector, RadioSelector, TextInput, etc.).
