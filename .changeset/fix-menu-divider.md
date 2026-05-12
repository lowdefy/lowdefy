---
'@lowdefy/api': patch
'@lowdefy/build': patch
---

fix(api,build): Render MenuDivider items in menus.

MenuDivider items defined in a menu's `links` were silently dropped at request time by `filterMenuList`, which only let `MenuLink` and `MenuGroup` items through. Dividers now pass the filter and render via the existing Antd menu block code. A post-pass removes orphaned dividers (leading, trailing, or adjacent to another divider) so an item left dangling after auth-based filtering does not produce a broken-looking separator. The `menuDivider` shape was also added to the build schema so configs containing dividers no longer trigger a schema warning, and `buildMenu` now assigns `auth: { public: true }` to dividers for consistency with other menu items.
