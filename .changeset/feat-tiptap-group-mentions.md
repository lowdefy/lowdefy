---
'@lowdefy/blocks-tiptap': minor
---

feat: Group mentions for TiptapMentionInput

`TiptapMentionInput` can now treat mention options as app-defined **groups** (roles, teams, queues, segments) in addition to individual people. All group data — which groups exist, their labels, colours, and members — comes from your config; the block ships no groups of its own.

- **Menu sections** — options with a `tag.section` are grouped under headings in the suggestion dropdown; options without one render flat, as before.
- **Group chips** — an option with `tag.group` renders a distinct chip carrying `class="tiptap-mention tiptap-mention-group"` and `data-mention-group="<group>"`, coloured inline from `tag.color` so the colour travels with the saved HTML.
- **Hover member popover** — `mentions.groupMembers` (a `{ '<group>': [{ name, email }] }` map, which may be loaded from a request) shows a group's current members when you hover its chip in the live editor.
- **Configurable suggestion cap** — `mentions.limit` (default 5) caps results, applied per section when sections are used so a large section can't crowd out a small one.

Also fixes a latent `getHref` bug: the element is now chosen by the function's return value, so a nullish return renders a plain `<span>` instead of `<a href="null">`. Options with no `tag.section`, `tag.group`, or `tag.color` are unaffected and render exactly as before.
