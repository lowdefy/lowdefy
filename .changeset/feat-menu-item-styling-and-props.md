---
'@lowdefy/blocks-antd': minor
'@lowdefy/build': minor
---

feat(blocks-antd): Per-item styling and new props for menu items.

Menu items in `Menu` and `DropdownMenu` now support the same `class` and slot-keyed `style` ergonomics as other Lowdefy blocks, plus the missing antd MenuItem props.

- **Per-item `class`** (Tailwind / arbitrary CSS) on `MenuLink`, `MenuGroup`, and `MenuDivider`. Flat string/array applies to the item wrapper; objects with dot-prefixed slot keys (`.element`, `.icon`, `.label`, and `.popup` on `MenuGroup` for the floating SubMenu popup) target specific parts.
- **Slot-keyed `style`** on the same item types using `.element` / `.icon` / `.label`. Flat objects continue to work as a shorthand for `.element`.
- **New item properties:** `properties.disabled` (greys out the item and blocks clicks), `properties.tooltip` (text shown when the menu is collapsed — maps to antd's `title`), and `properties.extra` (free-form right-aligned label on a `MenuLink`, e.g. `beta`, `soon`).
- **`shortcut` badge moved to the far right.** The existing `properties.shortcut` already auto-rendered a kbd badge and wired the key handler — the badge is now floated to the far right of the item to match common menu conventions (previously inline next to the title). When `extra` and `shortcut` are both set on the same item, `extra` sits to the left of the shortcut badge.
- **`extra` rendering note:** rendered inside the `<Link>` via `float: right` rather than antd's `extra` prop. The antd `extra` prop triggers a `display: inline-flex; width: 100%` layout on `.ant-menu-title-content-with-extra` that collapses Lowdefy-wrapped labels, so we bypass it.
- **Unified internals:** `Menu` and `DropdownMenu` now share one item builder, eliminating the prior divergence in icon CSS keys and which props were plumbed.

Block-level `properties.theme` on `Menu` is unchanged; pair it with `properties.danger: true` on a `MenuLink` to theme danger items via `dangerItem*` tokens. See the updated theming docs.
