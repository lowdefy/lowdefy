---
'@lowdefy/actions-core': minor
'@lowdefy/api': minor
'@lowdefy/block-utils': minor
'@lowdefy/blocks-antd': minor
'@lowdefy/build': minor
'@lowdefy/client': minor
'@lowdefy/engine': minor
'@lowdefy/helpers': minor
'@lowdefy/operators': minor
'@lowdefy/operators-js': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
---

feat: First-class i18n / locale support for Lowdefy apps.

Apps can now declare supported locales and message catalogs under
`config.i18n`, switch language at runtime, and translate their own
strings with ICU MessageFormat. Ant Design's component strings (date
pickers, modal Ok/Cancel, pagination, form validation messages),
dayjs date formatting, and the engine's built-in framework strings
(loading toasts, validation summaries, popup blocker warnings, error
page) all localize automatically once `config.i18n` is set.

```yaml
config:
  i18n:
    defaultLocale: en-US
    locales:
      - { code: en-US, label: English, antd: en_US, dayjs: en }
      - { code: de-DE, label: Deutsch, antd: de_DE, dayjs: de }
    messages:
      en-US: { greeting: 'Hello, {name}!' }
      de-DE: { greeting: 'Hallo, {name}!' }
```

**New schema** — `config.i18n` with `defaultLocale`, `fallbackLocale`,
`locales[]`, and `messages`. Validated at build time; only declared
locales are bundled (antd and dayjs locale imports are codegen'd, no
~150KB unused).

**New operators**

- [`_t`](/_t) — translate operator with ICU MessageFormat. Resolution
  order: active locale → fallback locale → built-in framework message
  → key.

  ```yaml
  _t:
    key: cart.items
    values: { count: { _state: itemCount } }
  ```

- [`_locale`](/_locale) — read `active` / `default` / `fallback` /
  `supported` locale state. Use with `Selector` to build a language
  picker.

**New action** — [`SetLocale`](/SetLocale) sets the user's preferred
locale (persisted to `localStorage`). Pass `'auto'` to clear the
preference and fall back to the browser language or default.

**Built-in framework strings.** Engine and client strings (`'Loading'`,
`'Success'`, `'This field is required'`, validation summaries, popup
blocker, error page) live in a built-in catalog and surface as English
by default. Authors override per-locale by adding the same key to
`config.i18n.messages`:

```yaml
messages:
  de-DE:
    engine.action.loading: 'Laden'
    engine.validation.fieldRequired: 'Pflichtfeld'
```

See the [Internationalization concept page](/i18n) for the full list
of overridable keys.

**Ant Design block cleanup.** `Modal`/`ConfirmModal` `okText`/`cancelText`
and date picker placeholders (`DateSelector`, `DateRangeSelector`,
`DateTimeSelector`, `MonthSelector`, `WeekSelector`) no longer hardcode
English defaults — they fall through to antd's `ConfigProvider locale`,
so a German app gets `'OK'` / `'Abbrechen'` / `'Datum auswählen'`
without per-block configuration. The antd `ConfigProvider` block
itself now accepts a `locale` prop for subtree overrides.

**Server-side translation.** API requests resolve the user's active
locale from the `Accept-Language` header and thread it into the server
operator parser, so `_t` works the same in server-side actions and
requests as on the client.

**Translation engine.** A new `translate()` helper in `@lowdefy/helpers`
backs both the `_t` operator and the engine/client adapter (installed
on `lowdefy._internal.t`). One source of truth for the lookup chain;
no duplication. Adds `intl-messageformat` as a foundational dep.
