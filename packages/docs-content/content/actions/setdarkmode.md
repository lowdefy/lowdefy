# SetDarkMode

```
(params?: {
  darkMode?: 'system' | 'light' | 'dark'
}): void
```

The `SetDarkMode` action sets the user's dark mode preference. When called without params, it cycles through `light`, `dark`, and `system`. When `darkMode` is provided, it sets the preference to that value.

- `'system'`: Follow the operating system's dark mode preference (and update live when the OS setting changes).
- `'light'`: Force light mode.
- `'dark'`: Force dark mode.

The preference is persisted to `localStorage` and triggers re-rendering of the root Ant Design `ConfigProvider`. All blocks and `_media: darkMode` expressions update automatically.

> **Note:** If the app's `theme.darkMode` config is set to `'light'` or `'dark'`, the developer has locked the mode. `SetDarkMode` still stores the user's preference, but it won't take visual effect until the config is changed to `'system'`.

#### Parameters

###### object (optional)
  - `darkMode: 'system' | 'light' | 'dark'`: Set the dark mode preference. When omitted, cycles through light, dark, and system.

#### Examples

###### Cycle dark mode preference:
```yaml
- id: toggle_button
  type: Button
  properties:
    title: Toggle Dark Mode
    icon:
      _if:
        test:
          _media: darkMode
        then: AiOutlineSun
        else: AiOutlineMoon
  events:
    onClick:
      - id: toggle
        type: SetDarkMode
```

###### Set dark mode to follow system preference:
```yaml
events:
  onClick:
    - id: use_system
      type: SetDarkMode
      params:
        darkMode: system
```

###### Force dark mode:
```yaml
events:
  onClick:
    - id: enable_dark
      type: SetDarkMode
      params:
        darkMode: dark
```
