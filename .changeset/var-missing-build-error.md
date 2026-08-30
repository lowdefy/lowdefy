---
'@lowdefy/build': major
'@lowdefy/codemods': major
---

A `_var` with no supplied var is now a build error.

`{ _var: title }` requires the `_ref` that loads the file to supply `title`. Previously an unsupplied string-form var silently resolved to `null`, so a typo in a var name — `titel` for `title` — rendered the template with a missing value and no error. The build now fails with an error that names the var, the file that reads it, the `_ref` that should have supplied it (file and line), and the var names that `_ref` did supply:

```
_var "titel" is not supplied. It is read in "templates/card.yaml", which is loaded by the _ref at "pages/home.yaml:12" resolving to "templates/card.yaml". Add "titel" to that _ref's vars, or write { _var: { key: titel, default: null } } to make it optional. Supplied vars: title, body.
```

All missing vars are collected in one build, so a whole app reports at once.

Migration: for a var that a caller may legitimately leave out, use the object form with a default:

```yaml
subtitle:
  _var:
    key: subtitle
    default: null
```

Writing a `default` key is what makes a var optional — `{ _var: { key: subtitle } }` with no `default` key is now required, exactly like the string form. `{ _var: { key: subtitle, default: null } }` keeps returning `null`, unchanged. A var supplied as `null` counts as supplied and does not fail the build.

The `v8-0-0/01-var-default-null` codemod prompt walks the mechanical cases: it runs the build, and for each error either adds the var to the naming `_ref` (where the error's "Supplied vars" list shows a typo) or rewrites the read to `default: null` (where the surrounding config already handles `null`), reporting every site and the reason.

`_module.var` is unchanged.
