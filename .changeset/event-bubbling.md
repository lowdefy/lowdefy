---
'@lowdefy/engine': minor
'@lowdefy/build': minor
'@lowdefy/blocks-aggrid': minor
'@lowdefy/docs': patch
---

feat: Events no longer bubble to the blocks around the block that handled them

A click on a block inside another clickable block used to run the events of both, so a Button in a clickable Card also opened the card, and a Box in a List row also ran the row's `onClick`. Now a browser event runs only the innermost event that handles it: once a block with actions for the event fires, the blocks around it skip that same browser event. A block without an event for the interaction, like a Paragraph in the card, still passes the click on to the card.

Set `bubble: true` on an event to also run the events of the blocks around it:

```yaml
events:
  onClick:
    bubble: true
    try:
      - id: select
        type: SetState
        params:
          selected: true
```

Inside AgGrid blocks, clicks on a cell's buttons, links, menus, inputs, selectors, switches or selection checkbox no longer trigger `onRowClick` or `onCellClick`. They only fire the control's own event.

This changes behaviour for apps that relied on a nested click running both events: add `bubble: true` to the inner event to keep it. Closes #1154.
