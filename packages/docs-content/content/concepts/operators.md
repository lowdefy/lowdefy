# Operators

Operators are functions, that can be used to express logic. They are the reason why Lowdefy apps are not completely static, but can react to data and inputs. Operators can be used in `blocks`, `actions`, `requests`, and `connections`. See the specific documentation for more details.

Each operators expects arguments with a specific structure. They can be the result of other operators, since operators are evaluated beginning with the most nested operators.

If an operator errors while evaluating, it returns a `null` value, and logs the error to the console.

## Unknown operators fail the build

From v8, an operator name your app does not have is a build error, not a warning:

```
Operator type "_stat" was used but is not defined. Did you mean "_state"?
```

The fix is either the correct operator name, or installing the plugin that provides it and listing it under `plugins` in `lowdefy.yaml`.

Before v8 this was only a warning, and the unresolved object was left in place - so `{ _stat: 'x' }` rendered on the page as the literal `{"_stat":"x"}`. Making it an error means a typo is caught at build time instead of showing up as a wrong value at runtime.

If a key genuinely is not an operator and only looks like one - a single key starting with an underscore, such as a MongoDB `$`-free document field named `_rev` - suppress the check with `~ignoreBuildChecks` on the containing node:

```yaml
properties:
  document:
    _rev: abc123
    ~ignoreBuildChecks: [types]
```

The suppression cascades to children, so it can also be declared on the block or the page. See [Lowdefy schema](/lowdefy-schema) for the full list of check slugs.

## Client or server operators

Some operators are only available on either the client or the server. For example, the [`_menu`](/_menu) operator is only useful on the client and is thus not included in server requests. Likewise, the [`_secret`](/_secret) operator is only available on the server for security reasons.

If a operator has special environment considerations, it is indicated on the individual operator documentation page. If no indication is made, the operator can be used under both environments.

##### Client only operators:
- [_actions](/_actions)
- [_api](/_api)
- [_event](/_event)
- [_global](/_global)
- [_index](/_index)
- [_input](/_input)
- [_location](/_location)
- [_media](/_media)
- [_menu](/_menu)
- [_request](/_request)
- [_url_query](/_url_query)

##### Server only operators:
- [_hash](/_hash)
- [_item](/_item)
- [_payload](/_payload)
- [_secret](/_secret)
- [_step](/_step)

Operators that are client side only cannot be used in `Requests` and `Connections`, and operators which are server side only cannot be used in `Blocks` and `Actions`.

## Build time operators

Besides the client and server environment, app build time is considered a third environment where special operator logic applies.

The `_ref` and `_var` operators do not work like other operators. They are evaluated while an app is being built, and can thus be used anywhere in the app configuration. They are used to split an app into multiple files, and to reuse configuration. See [`_ref`](/_ref) for more details.

Some operators can be evaluated at build time by using the [`_build`](/_build) operator. This is useful for once-off calculations when an app is built, for example looping over a list in a reference JSON file to calculate a value at build time instead of using normal operators which re-evaluate whenever the app state changes. It can also be used to read an environment variable.

The [`_module`](/_module) operators provide access to module-scoped values during the build. See [Writing Modules](/module-authoring) for details.
