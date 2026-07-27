---
'@lowdefy/helpers': minor
'@lowdefy/operators': patch
'@lowdefy/operators-js': patch
'@lowdefy/engine': patch
'@lowdefy/plugin-better-auth': patch
'lowdefy': patch
---

fix(helpers): Dot paths always split on `.` — literal dotted keys must now be escaped.

Operators that read by dot path (`_state`, `_get`, `_actions`, `_request`, `_payload`,
`_url_query`, `_user`, `_secret`, `_global`, and others) previously had a fallback: when a
path segment was missing, they re-joined the remaining segments looking for a key that
literally contained a dot. That fallback is removed. A path is now split on `.` and walked,
full stop.

Reading a whole key that contains dots still works — `_url_query: my_object.subfield`
against `?my_object.subfield=x` resolves as before. What changes is reading *through* or
*under* such a key, at any depth:

```yaml
# data: { 'a.b': { c: 1 } }
_get: { from: ..., key: a.b.c }     # was 1, now null
_get: { from: ..., key: a\.b.c }    # 1
```

If your data has a key with a literal dot in it, escape the dot with a backslash. The most
likely place to hit this is a JWT `claimMapping` where the identity provider embeds a dotted
client id — Keycloak's `resource_access.<clientId>.roles` with a client id like
`com.example.api` must now be written `resource_access.com\.example\.api.roles`. Auth0 and
Azure AD URL-namespaced claims are top-level keys and are unaffected.

**This change fails quietly.** A path that no longer resolves returns the operator's default
(`null`) rather than raising an error. If a value that used to resolve is suddenly empty,
check whether the key it reads through contains a literal dot.

`unset` changes the same way: `unset({ 'a.b': 1 }, 'a.b')` no longer deletes the literal
dotted key and is now a no-op; use `a\.b`. This makes reads and deletes consistent with
writes, which have always split on `.`.
