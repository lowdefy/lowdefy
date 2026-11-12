# Migration: Remove the react-icons Icon Set

## Context

Lowdefy 7 replaced react-icons with [Lucide](https://lucide.dev) and shipped
`@lowdefy/icons-react-icons`, an icon-set plugin holding every react-icons 5.6.0 icon under its old
name, as a migration aid. **Lowdefy 8 removes that set.** It is no longer published, and Lowdefy 8
draws Lucide icons and icons from icon-set plugins only.

An app that used the set fails the Lowdefy 8 build in two ways:

| Config                                                           | Lowdefy 8 build                                                                                                              |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `theme.icons.set: react-icons`                                   | Fails: no installed plugin declares the `react-icons` set, and the message says the set was removed.                         |
| A react-icons name at an icon position, unqualified or qualified | Fails at its config location with the semantic or Lucide name to use, for `AiOutlineUser` and `react-icons:FaWhatsapp` both. |

```
Icon "react-icons:AiOutlineCreditCard" is a react-icons name. Lowdefy uses Lucide icons. Use "CreditCard". The react-icons icon set (@lowdefy/icons-react-icons) was removed in Lowdefy 8.
```

This migration removes the plugin and the `set: react-icons` setting, and rewrites every
react-icons name in the app to a semantic or Lucide name with the same table the Lowdefy 7
upgrade used. An app that ran the Lowdefy 7 migration without the compatibility set has nothing to
change here; steps 1 and 2 find nothing.

Icon names take three forms in Lowdefy 8, as in Lowdefy 7:

| Form          | Example                          | Meaning                                                                                                         |
| ------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Semantic**  | `edit`, `delete`, `chevron-down` | A lowercase kebab-case name Lowdefy maps to an icon. Apps can re-map it in `theme.icons.aliases`. Prefer these. |
| **Set name**  | `Pencil`, `CreditCard`           | A Lucide icon, PascalCase, exactly as Lucide names it.                                                          |
| **Qualified** | `lucide:Pencil`, `brands:Github` | An icon in a named icon set, from Lucide or an icon-set plugin the app installs.                                |

## The Migration Table

This step reuses the Lowdefy 7 table, `v7-0-0/react-icons-to-lucide.json` in the
`@lowdefy/codemods` package. `lowdefy upgrade` downloads the package to `.lowdefy/codemods/` in the
app's config directory, so the table is at:

```
.lowdefy/codemods/v7-0-0/react-icons-to-lucide.json
```

(If that folder is missing, download it from
`https://unpkg.com/@lowdefy/codemods@7/v7-0-0/react-icons-to-lucide.json`.)

Its shape:

```json
{
  "icons": {
    "AiOutlineDelete": "delete",
    "AiOutlineCreditCard": "CreditCard",
    "LuTrash2": "Trash",
    "FaWhatsapp": "MessageCircle"
  },
  "review": {
    "AiFillCheckCircle": "Filled glyph; Lucide icons are outline only.",
    "FaWhatsapp": "Brand logo; Lucide has no brand icons, MessageCircle is a generic stand-in. Use the react-icons compatibility set to keep the logo."
  }
}
```

- `icons` maps each old name to its new name. A lowercase value is a **semantic name**; a
  PascalCase value is a **Lucide name**. Every value resolves in Lowdefy 8.
- `review` lists the entries where the new glyph is a judgement call or a known loss (filled and
  two-tone glyphs become outline, brand logos become generic glyphs, file-type glyphs become
  generic file glyphs). The rewrite still applies; the author reviews the result.
- **The review notes were written for Lowdefy 7.** Notes that say "Use the react-icons
  compatibility set to keep the logo" no longer apply: the set is gone. A brand logo now needs an
  icon-set plugin of the app's own (see [Brand logos](#brand-logos)).
- The table covers every Ant Design name in react-icons (`AiOutline*`, `AiFill*`, `AiTwotone*`),
  every `Lu*` name, and the names from other packs seen in real apps. Apps that kept the
  compatibility set can use names from any react-icons pack, so expect more unmapped names here
  than in the Lowdefy 7 migration, mostly brand logos (`Si*`, `Fa*`).

**Load the table and apply it with a script** (Node is available in every Lowdefy project). Apps
often have thousands of icon occurrences; do not rewrite them by hand.

## What to Do

### 1. Remove the plugin

Find `@lowdefy/icons-react-icons` and remove it:

- the `plugins` list in `lowdefy.yaml`, or a file it `_ref`s:

  ```yaml
  plugins:
    - name: '@lowdefy/icons-react-icons'
      version: 7.0.0
  ```

- `dependencies` in any `package.json` in the app (the app root, local plugin packages), and its
  entries in lock files (`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`). Prefer the package
  manager (`pnpm remove @lowdefy/icons-react-icons`) over editing a lock file by hand.

Skip `node_modules/`, `.lowdefy/`, `.git/` and build output folders, here and in every step below.

### 2. Remove `theme.icons.set: react-icons`

```yaml
# Before
theme:
  icons:
    set: react-icons
    size: 18
# After
theme:
  icons:
    size: 18
```

Remove only the `set` key, and keep the other `theme.icons` settings. If `icons` is left empty,
remove it too. Without `set`, Lucide is the default set again, so unqualified names resolve in
Lucide and the semantic names keep working.

If `theme.icons.set` names any other set, leave it.

### 3. Find every react-icons name

An icon name is always a **whole string value**. Match a name only as a whole token. Two forms:

```
# Qualified: the old set id, a colon, and the react-icons name
\breact-icons:([A-Za-z0-9]+)\b
# Unqualified: a react-icons pack prefix and a name
\b(Ai|Bi|Bs|Cg|Ci|Di|Fa|Fc|Fi|Gi|Go|Gr|Hi|Im|Io|Lia|Lu|Md|Pi|Ri|Rx|Si|Sl|Tb|Tfi|Ti|Vsc|Wi)[A-Z0-9][A-Za-z0-9]*\b
```

Look in all of these places:

| Where                                                                                              | Example                                                                                                          |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| YAML config (`.yaml`, `.yml`)                                                                      | `icon: AiOutlineEdit`, `icon: react-icons:FaWhatsapp`, `name: AiOutlineHome`, `- AiOutlineUser`                  |
| Nunjucks templates (`.njk`, `.yaml.njk`)                                                           | `icon: AiOutlineSave` — these often do not parse as YAML, so treat them as text                                  |
| JSON files (`.json`)                                                                               | `"icon": "react-icons:SiStripe"`                                                                                 |
| `_js` code strings                                                                                 | `return 'AiOutlineCheck'` or `return "AiOutlineCheck"` inside `_js:` blocks and `.js` files referenced by `_ref` |
| HTML strings                                                                                       | `<span data-icon="react-icons:FaGithub"></span>`                                                                 |
| Local plugin JS (custom blocks/actions)                                                            | string literals `'AiOutlineUser'` and `meta.icons: ['react-icons:FaSlack']`                                      |
| `theme.icons.aliases` targets                                                                      | `whatsapp: react-icons:FaWhatsapp`, `invoice: AiOutlineFileText`                                                 |
| `theme.icons.include`                                                                              | `- AiOutlineFlag`                                                                                                |
| Enum/global maps, `_if`/`_get` branches, module vars, request pipelines (`$switch` `then:` values) | `then: AiOutlineCheckCircle`                                                                                     |

### 4. Rewrite each name with the table

Rewrite **qualified names first**, then unqualified names:

1. For each `react-icons:<Name>` where `<Name>` is a key of `table.icons`, replace the whole
   qualified name, set id and colon included, with `table.icons[<Name>]`:
   `react-icons:FaWhatsapp` → `MessageCircle`. A qualified name that keeps its `react-icons:`
   prefix can never resolve in Lowdefy 8.
2. For each unqualified match that is a key of `table.icons`, replace the name with its value.

Preserve the surrounding text exactly (quotes, indentation, YAML style). A qualified name whose
`<Name>` is not in the table stays as it is for now and goes in the report; the unqualified pass
finds no table key in it either, so it is left alone.

- **Prefer semantic names.** The table already chooses a semantic name wherever one means exactly
  the same thing (`AiOutlineDelete` → `delete`, `AiOutlineHome` → `home`). Keep them; do not expand
  them to Lucide names.
- **`theme.icons.aliases` targets must stay set or qualified names**, never semantic names (an
  alias cannot point at another semantic name). When the table gives a semantic value for an alias
  target, write that semantic name's Lucide target instead, e.g.
  `invoice: AiOutlineFileText` → `invoice: FileText`, `trash: react-icons:LuTrash2` →
  `trash: Trash`. The dev server's MCP tool `lowdefy_search_icons` returns each semantic name with
  its target; the list at the end of `.lowdefy/codemods/v7-0-0/01-react-icons-to-lucide.md` has
  them too.
- **Names not in the table.** Do not guess. Find the Lucide icon that matches by meaning
  (`lowdefy_search_icons`, or search https://lucide.dev/icons) and use its PascalCase name. If
  nothing fits, or the name is a brand logo, leave it and list it in the report.
- **Already migrated names stay.** Semantic names, Lucide names and qualified names in other sets
  (`lucide:Pencil`, `brands:Github`) never match the patterns above, so running the migration again
  changes nothing.

### 5. Report what needs a human

Do not change data. Produce a report with:

1. **Brand logos.** Every rewritten name whose `table.review` note starts with "Brand logo", and
   every unmapped name that is a brand logo (`SiStripe`, `FaSlack`, …): old name, new name if any,
   and each file (and line). Lucide has no brand icons, so the rewrite drew a generic glyph. To
   keep a logo, the app needs an icon-set plugin of its own that holds it, used by its qualified
   name (`brands:Whatsapp`); see
   [Icon Sets](https://docs.lowdefy.com/plugins-icon-sets). Flag any of these in public-facing
   places (login buttons, social links, footers) first.
2. **Other review entries.** Every other rewritten name that is a key of `table.review`: old name,
   new name, the review note, and each file (and line) it was rewritten in. Group by old name.
3. **Unmapped names.** Every react-icons name found that is not in the table, with its locations
   and the Lucide name chosen by meaning, or "left unchanged". Names left unchanged fail the build
   where the build checks them (see [Verification](#verification)) and render the missing-icon
   glyph elsewhere.
4. **Runtime-only icon sources.** Icon positions whose value comes from data rather than config,
   so no text rewrite can reach it. Apps that kept the compatibility set often did so for exactly
   these, so look closely:

   - `icon:`, `name:` (Icon block), `prefixIcon:`, `suffixIcon:` and other `*Icon:` properties,
     menu link `icon:` and HTML `data-icon` values that are `_state`, `_payload`, `_request`,
     `_input`, `_url_query`, `_user`, `_global` or `_get` with `from:` one of those;
   - request pipelines (for example MongoDB `$switch`, `$cond`, `$project`) that return an icon
     field built from document fields rather than literals;
   - enum lists used as an icon picker whose chosen value is saved to a database.

   For each, note that icon names stored in a database or built at runtime are not checked by the
   build and now render the missing-icon glyph. They must be migrated in the data, outside this
   codemod, with the table at
   `https://unpkg.com/@lowdefy/codemods@7/v7-0-0/react-icons-to-lucide.json`, and names only known
   at runtime must be listed in `theme.icons.include` so the build bundles them.

5. **Totals:** files changed, occurrences rewritten (qualified and unqualified), how many to
   semantic names and how many to Lucide names, and whether the plugin and `set: react-icons` were
   removed.

## Brand Logos

Lucide has no brand icons, and Lowdefy 8 has no react-icons set to fall back on. An app that needs
a logo (WhatsApp, GitHub, Stripe) writes a small icon-set plugin that declares its own set, for
example `brands`, holding just the logos it uses, from any source it chooses (Simple Icons, the
brand's own SVG). Its icons are then reached by qualified name (`icon: brands:Whatsapp`) next to
Lucide names. [Icon Sets](https://docs.lowdefy.com/plugins-icon-sets) shows how to write one. This
step does not create the plugin; it rewrites logos to the table's generic glyph so the app builds,
and lists them so the author can decide.

## Examples

### Before

```yaml
plugins:
  - name: '@lowdefy/icons-react-icons'
    version: 7.0.0

theme:
  icons:
    set: react-icons
    aliases:
      invoice: AiOutlineFileText

pages:
  - id: home
    type: PageHeaderMenu
    blocks:
      - id: save_button
        type: Button
        properties:
          title: Save
          icon: AiOutlineSave
      - id: whatsapp
        type: Button
        properties:
          title: Chat with us
          icon: react-icons:FaWhatsapp
      - id: status_icon
        type: Icon
        properties:
          name:
            _if:
              test:
                _state: done
              then: AiFillCheckCircle
              else: MdOutlineSchedule
      - id: pay
        type: Button
        properties:
          title: Pay with Stripe
          icon: react-icons:SiStripe
```

### After

```yaml
theme:
  icons:
    aliases:
      invoice: FileText

pages:
  - id: home
    type: PageHeaderMenu
    blocks:
      - id: save_button
        type: Button
        properties:
          title: Save
          icon: save
      - id: whatsapp
        type: Button
        properties:
          title: Chat with us
          icon: MessageCircle
      - id: status_icon
        type: Icon
        properties:
          name:
            _if:
              test:
                _state: done
              then: check-circle
              else: Clock
      - id: pay
        type: Button
        properties:
          title: Pay with Stripe
          icon: react-icons:SiStripe
```

In the report: `FaWhatsapp` → `MessageCircle` under brand logos; `AiFillCheckCircle` (filled glyph
becomes outline) under review entries; `react-icons:SiStripe` under brand logos as unmapped, since
`SiStripe` is not in the table and Lucide has no Stripe logo. `MdOutlineSchedule` is not in the
table either; it is listed with the unmapped names, with `Clock` as the name chosen by meaning. The `react-icons:SiStripe` button still fails the build until the author picks a Lucide
icon (`CreditCard`) or adds an icon-set plugin with the logo.

### `_js` and local plugins

```yaml
# Before
icon:
  _js: |
    return state.approved ? 'AiOutlineCheck' : "react-icons:AiOutlineClose";
# After
icon:
  _js: |
    return state.approved ? 'check' : "close";
```

```javascript
// Before — local plugin block
MyBlock.meta = { category: 'display', icons: ['react-icons:AiOutlineUser', 'LuPencil'] };
// After
MyBlock.meta = { category: 'display', icons: ['user', 'Pencil'] };
```

## Edge Cases

- **`PiSquare` changes glyph silently.** With `set: react-icons`, `PiSquare` drew the Phosphor
  square. Lucide also has an icon named `PiSquare` (a pi sign in a square), so once `set` is
  removed it resolves to Lucide with no build error. It is not in the table. Where the app meant
  the square, rewrite it to `Square`, and list it in the report. No other react-icons name is also
  a Lucide name.
- **Block `type:` values are not icons.** Lucide has icons named like some block types (`Anchor`,
  `Badge`, `Calendar`, `Menu`, `Tag`, …). Only rewrite names that match the patterns above; never
  touch `type:` values.
- **An icon-set plugin of the app's own that uses the set id `react-icons`.** Rare, but then
  `theme.icons.set: react-icons` and `react-icons:` names point at that plugin, not the removed
  package. Leave them, and say so in the report.
- **Direct `react-icons` imports in local plugins** (`import … from 'react-icons/…'`) do not go
  through the icon set, so this step does not change them. They keep working only if the plugin
  declares `react-icons` as its own dependency; list them in the report.
- **Names inside prose** (descriptions, markdown, help text) that mention an icon for a human
  reader can be rewritten too, but list them in the report rather than assuming.
- **Tests and snapshots** in local plugins that assert old icon names need the same rewrite.
- **Data stays untouched.** Never modify database documents, seed files that are loaded into a
  database at runtime, or fixtures, unless the author asks; list them in the report instead.

## Verification

1. Nothing references the removed set, and no react-icons names remain (the only allowed matches
   are names listed in the report as unmapped or brand logos):

   ```
   grep -rnE 'icons-react-icons|set:\s*react-icons|\breact-icons:|\b(Ai|Bi|Bs|Cg|Ci|Di|Fa|Fc|Fi|Gi|Go|Gr|Hi|Im|Io|Lia|Lu|Md|Pi|Ri|Rx|Si|Sl|Tb|Tfi|Ti|Vsc|Wi)[A-Z0-9][A-Za-z0-9]*\b' \
     --include='*.yaml' --include='*.yml' --include='*.njk' --include='*.json' --include='*.js' \
     --exclude-dir=node_modules --exclude-dir=.lowdefy .
   ```

2. Run `lowdefy build`. A react-icons name that is still in config fails the build with its config
   location and the name to use. Fix each one with the table or a Lucide search, and rebuild until
   the build passes.

   The build checks literal names at icon positions: keys ending in `icon` (`icon`, `prefixIcon`,
   …), an Icon block's `properties.name`, `data-icon` attributes in HTML strings, and
   `theme.icons.aliases` and `theme.icons.include`. It does **not** check names inside operators
   (`_if`, `_js`, …), request properties, or local plugin code and `meta.icons`; a name there that
   does not resolve renders the missing-icon glyph at runtime. The grep in step 1 is the check for
   those.

   `lowdefy upgrade` sets `lowdefy:` in `lowdefy.yaml` to the new version only after the last step
   of this phase, so until then `lowdefy build` builds with the app's Lowdefy 7 version. That build
   fails on the same names, but its messages suggest installing the compatibility set, and it
   reports a `react-icons:` name as naming a set that is not installed. Ignore that advice and use
   the name from the table.
