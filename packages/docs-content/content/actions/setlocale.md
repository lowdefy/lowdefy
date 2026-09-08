# SetLocale

```
(params?: {
  locale?: string
}): void
```

The `SetLocale` action sets the user's active locale preference for the app. The preference is persisted to `localStorage` (`lowdefy_locale`) and triggers re-rendering of the root Ant Design `ConfigProvider`. All blocks, `_t` translations, `_locale` operators, antd-built-in strings (date pickers, modals, validation), and dayjs date formatting update automatically.

- `locale`: A BCP 47 code declared in `config.i18n.locales` (e.g. `'en-US'`, `'de-DE'`).
- `'auto'` (or no params): Clears the user preference. The app falls back to the browser language best-fit, then to `config.i18n.defaultLocale`.

`SetLocale` is a no-op when `config.i18n` is not configured.

#### Parameters

###### object (optional)
  - `locale: string`: A BCP 47 locale code declared in `config.i18n.locales`, or `'auto'` to clear the preference.

#### Examples

###### Switch to German:
```yaml
events:
  onClick:
    - id: switch_de
      type: SetLocale
      params:
        locale: de-DE
```

###### Wire a language picker:

`_locale: supported` returns an array of locale descriptors `{ code, label, antd, dayjs }`. Selector options must be `{ value, label }` pairs, so map each descriptor onto that shape:
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

###### Reset to browser/default:
```yaml
events:
  onClick:
    - id: reset_locale
      type: SetLocale
      params:
        locale: auto
```
