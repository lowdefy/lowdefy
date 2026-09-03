---
'@lowdefy/build': minor
'@lowdefy/api': patch
---

feat(build): `collections.fields.<field>.pii`, collection-level `required` in the schema, cheaper reads

A collection field can be declared `pii: true`; the build keeps the annotation out of the JSON Schema fragment and lists the names on the collection artefact (`pii: [email]`) for the journey recorder, log redaction and fixture export to consume. The config schema now accepts the collection-level `required` array, nested `properties` and `description` on a field, and the migration check reads the array form. A read request no longer resolves the collection contract at all: only write types consult it.
