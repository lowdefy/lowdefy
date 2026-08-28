---
'@lowdefy/helpers': minor
'@lowdefy/blocks-antd': patch
'@lowdefy/connection-axios-http': patch
'@lowdefy/build': patch
'lowdefy': patch
---

fix(helpers): Deep merges replace arrays instead of merging them index-by-index.

Wherever Lowdefy deep-merges configuration — block property defaults, `AxiosHttp` connection
and request config, theme tokens, i18n message catalogs — an array value is now treated as a
single value. A later array replaces an earlier one; it no longer merges element-by-element
at matching indices.

This is what most overrides already assumed, and it matches a plain object spread. Two
places where the old behaviour was visible:

- `RatingSlider`'s `CheckboxInput.options` — overriding it previously inherited the default
  element's `label: 'N/A'`. It no longer does; specify the full option object.
- The layout blocks (`PageHeaderMenu`, `PageSiderMenu`, `PageSidebarLayout`, `MobileMenu`) —
  if you set the same array (`selectedKeys`, `defaultOpenKeys`, `links`) on both `menu` and a
  breakpoint variant such as `menuLg` or `menuMd`, the breakpoint value now replaces the base
  value outright rather than overlaying it index-by-index.

Also fixed: merging no longer mutates its inputs. `AxiosHttp` previously wrote merged request
config back into the shared connection config, leaking values such as the HTTP agent between
requests.

`lodash.merge`, the last remaining lodash dependency in Lowdefy, has been removed.
