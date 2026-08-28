---
'@lowdefy/build': patch
---

fix(build): Reject reserved names as agent ids, agent tool names, locale codes, event shortcuts, auth
provider ids, auth role ids and the page, endpoint and websocket ids the auth build keys on.

Each of these author-written identifiers later becomes a key in a plain object — the sub-agent graph
and agent registry, the agent `tools` map, the i18n message catalogs, the client's shortcut map, the
BetterAuth provider config, the organization plugin's role catalog and the auth entity role maps. A
reserved name such as `__proto__` or `constructor` resolved through `Object.prototype` instead of
adding an entry, so the config built clean and misbehaved later: a duplicate id went undetected, a
page was silently marked protected with `Object.prototype.constructor` as its roles, or the build
crashed with an unlocated internal error. Only the agent `tools` map already failed loudly, with a
bare `ReservedKeyError` from `setKey` at runtime. None of these sites had a build-time shape check,
and the agent tool-name rule `^[a-zA-Z0-9_-]{1,64}$` admits every reserved name.

The build now rejects them where the identifier is first accepted, with a located `ConfigError` naming
the offending value. Checks on derived names run on the derived value: a sub-agent id `a/__proto__`
still yields the tool name `a____proto__`, while an endpoint id `/proto__` — which derives
`__proto__` — is rejected. A shortcut like `Ctrl+__proto__` is still valid.

Collected build errors are now deduplicated: two errors that resolve to the same source line with
the same message are reported once. An id rejected by two build steps — the auth build reaches
page, endpoint and websocket ids before `validateId` does — therefore reads as a single error rather
than two identical ones.

Apps using a reserved name for one of these identifiers will now fail the build. Rename the identifier.
