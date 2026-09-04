---
'@lowdefy/build': minor
'@lowdefy/docs': patch
---

feat(build): connections are file plugins

A directory `plugins/connections/<ConnectionType>/` holding `<ConnectionType>.js` and one resolver per file under `requests/` defines a connection type and its request types with no npm package, no `types.js` barrel and no `plugins:` entry, the same convention blocks, actions and operators follow. The build discovers them, assembles the connection's `requests` map from the resolver files so a request is never wired up twice, emits a path import into the generated connections barrel (the copy under the server directory for a production build), and reads each type's schema and meta from its sibling JSON. A request that declares neither `meta.checkRead` nor `meta.checkWrite` is gated on both, so a file plugin can never open a connection wider by staying silent, and the build warns naming the JSON file to declare them in. A connection file plugin cannot yet be used under `auth.organizations.policy: tenant`.
