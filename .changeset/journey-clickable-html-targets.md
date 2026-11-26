---
'@lowdefy/block-utils': minor
'@lowdefy/blocks-basic': minor
'@lowdefy/client': minor
'@lowdefy/helpers': minor
'@lowdefy/node-utils': minor
'@lowdefy/journey-headless': minor
'@lowdefy/server-dev': minor
'@lowdefy/engine': patch
'@lowdefy/e2e-utils': patch
'lowdefy': minor
---

feat(journey): Journeys target `ClickableHtml` elements by event and `data-id`

A journey names a `ClickableHtml` element as `{ blockId, control: <its data-event>, rowKey: <its data-id> }`, or by `control` alone when it has no `data-id`, so clicks on the rows and buttons of a `ClickableHtml` list no longer need `containing`, `text` or `nth` and run headless:

```yaml
- click: { blockId: issue_cards, control: onOpenIssue, rowKey: issue-17 }
- click: { blockId: pairs_list, control: onMerge, rowKey: pair-1 }
- click: { blockId: pairs_list, control: ok } # the confirm dataEvents asks for
- expect: { hidden: { blockId: pairs_list, control: onMerge, rowKey: pair-1 } }
```

- `ClickableHtml` marks each element whose event its `dataEvents` lists with the journey control marks, popover content included, and marks the confirm it asks as its `ok` and `cancel` controls. The marks are left out of the event object.
- In the browser the runner finds the one visible marked element, opening the popover that holds it first. Headless, a `ClickableHtml` stand-in reads the block's rendered `html` and fires the event with the event object the browser builds, after the confirm when one is asked.
- `expect.visible` and `expect.hidden` take `control`, alone or with `rowKey`. A grid's cell control stays a browser check there.
- No match, or several, fails and names what was found.
- The recorder writes the target for a click on a marked element that no other visible element shares marks with.
- Lint L8 suggests, for a click that reads the page, the control its newest measured browser run clicked (`exercised.controls`).
