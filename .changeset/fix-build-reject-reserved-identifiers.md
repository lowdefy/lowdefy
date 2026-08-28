---
'@lowdefy/build': patch
---

fix(build): Reject reserved names as agent ids, locale codes and event shortcuts.

Each of these author-written identifiers later becomes a key in a plain object — the sub-agent graph
and agent registry, the i18n message catalogs and the client's shortcut map. A reserved name such as
`__proto__` or `constructor` resolved through `Object.prototype` instead of adding an entry, so the
config built clean and misbehaved later: a duplicate id went undetected, or the build crashed with an
unlocated internal error. None of these sites had a build-time shape check.

The build now rejects them where the identifier is first accepted, with a located `ConfigError` naming
the offending value. A shortcut like `Ctrl+__proto__` is still valid.

Apps using a reserved name for one of these identifiers will now fail the build. Rename the identifier.
