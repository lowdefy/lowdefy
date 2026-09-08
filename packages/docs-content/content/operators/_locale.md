# _locale

```
(key: 'active' | 'default' | 'fallback' | 'supported'): string | object[]
```

The `_locale` operator reads the current locale state. Use it to render language pickers, conditional content per locale, or to display the active locale.

The view exposes:

- `active: string` — the resolved active locale (e.g. `'de-DE'`).
- `default: string` — the configured `config.i18n.defaultLocale`.
- `fallback: string` — always `'en-US'`. Lowdefy uses `en-US` as a fixed fallback when a key is missing in the active locale, so plugin and module authors should always ship `en-US` translations.
- `supported: object[]` — the list of locales declared in `config.i18n.locales`. Each item has `{ code, label, antd, dayjs }`.

Pair with the [`SetLocale`](/SetLocale) action to build a language picker.

#### Arguments

###### string
One of `active`, `default`, `fallback`, or `supported`.

#### Examples

###### Read the active locale:
```yaml
_locale: active
```
Returns: e.g. `"de-DE"`.

###### Render a language picker:

`_locale: supported` returns `[{ code, label, antd, dayjs }, ...]`. Selector options must be an array of `{ value, label }` pairs — project each descriptor onto that shape with `_array.map`:
```yaml
- id: lang_picker
  type: Selector
  properties:
    options:
      _array.map:
        on:
          _locale: supported
        callback:
          _function:
            value:
              __args: 0.code
            label:
              __args: 0.label
    value:
      _locale: active
  events:
    onChange:
      - id: set_locale
        type: SetLocale
        params:
          locale:
            _state: lang_picker
```

###### Show only when a specific locale is active:
```yaml
visible:
  _eq:
    - _locale: active
    - de-DE
```
