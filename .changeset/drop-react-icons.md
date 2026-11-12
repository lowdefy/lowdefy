---
'@lowdefy/build': major
'@lowdefy/codemods': minor
---

feat!: Remove the react-icons icon set

`@lowdefy/icons-react-icons`, the icon set that kept every react-icons 5.6.0 icon under its old name (`AiOutlineUser`, `FaWhatsapp`) as a migration aid after Lowdefy 7 moved to Lucide, is no longer published. Lowdefy 8 draws Lucide icons and icons from icon-set plugins only.

A react-icons name in config now fails the build at its config location with the Lucide name to use, from the same table the Lowdefy 7 upgrade codemod applies:

```
Icon "react-icons:AiOutlineCreditCard" is a react-icons name. Lowdefy uses Lucide icons. Use "CreditCard". The react-icons icon set (@lowdefy/icons-react-icons) was removed in Lowdefy 8.
```

`theme.icons.set: react-icons` fails the build too, with a message that says the set was removed.

To migrate an app that used the set, run `lowdefy upgrade`. Its Lowdefy 8 step, `remove-react-icons-set`, removes the plugin and `set: react-icons`, rewrites react-icons names (qualified and unqualified) with the same table, reports what it cannot fix, and finishes with a build. To migrate by hand:

1. Remove `@lowdefy/icons-react-icons` from `plugins` and `set: react-icons` from `theme.icons`.
2. Run `lowdefy build`. Replace each name it reports with the suggested semantic or Lucide name, or search for one with the dev server's `lowdefy_search_icons` tool or at https://lucide.dev/icons. Qualified names (`react-icons:FaWhatsapp`) need the same change. The build checks names at icon properties only; names inside operators such as `_if` and `_js`, and in plugin code, render the missing-icon glyph instead, so search the config for them too.
3. Icon names stored in a database or built at runtime are not checked by the build. Migrate them in the data with the table at https://unpkg.com/@lowdefy/codemods@7/v7-0-0/react-icons-to-lucide.json, and list names only known at runtime in `theme.icons.include`.
4. Brand logos that Lucide does not have (`FaWhatsapp`, `SiStripe`) can be kept with an icon-set plugin of your own; see [Icon Sets](https://docs.lowdefy.com/plugins-icon-sets).
