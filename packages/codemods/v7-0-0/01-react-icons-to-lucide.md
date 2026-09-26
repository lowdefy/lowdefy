# Migration: react-icons Names → Lucide Icons

## Context

Lowdefy v7 replaces react-icons with [Lucide](https://lucide.dev). Every icon name in an app's
config is resolved and bundled by the build, and a name the build cannot resolve at an icon
position **fails the build**. react-icons names (`AiOutlineUser`, `MdLocationOn`, `LuPencil`, …)
are no longer icon names unless the app installs the react-icons compatibility set (see
[Fallback](#fallback-the-react-icons-compatibility-set)).

An icon name now takes one of three forms:

| Form          | Example                                      | Meaning                                                                                                         |
| ------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Semantic**  | `edit`, `delete`, `chevron-down`             | A lowercase kebab-case name Lowdefy maps to an icon. Apps can re-map it in `theme.icons.aliases`. Prefer these. |
| **Set name**  | `Pencil`, `CreditCard`                       | A Lucide icon, PascalCase, exactly as Lucide names it.                                                          |
| **Qualified** | `lucide:Pencil`, `react-icons:AiOutlineUser` | An icon in a named icon set.                                                                                    |

This migration rewrites react-icons names (and stale Ant Design names such as `HomeOutlined`,
which have never rendered anything in Lowdefy) to semantic or Lucide names, using a migration
table that ships with this codemod.

## The Migration Table

The table is `v7-0-0/react-icons-to-lucide.json` in the `@lowdefy/codemods` package. `lowdefy
upgrade` downloads the package to `.lowdefy/codemods/` in the app's config directory, so the
table is at:

```
.lowdefy/codemods/v7-0-0/react-icons-to-lucide.json
```

(If that folder is missing, download it from
`https://unpkg.com/@lowdefy/codemods@latest/v7-0-0/react-icons-to-lucide.json`.)

Its shape:

```json
{
  "icons": {
    "AiOutlineDelete": "delete",
    "AiOutlineCreditCard": "CreditCard",
    "HomeOutlined": "home",
    "LuTrash2": "Trash"
  },
  "review": {
    "AiOutlineAlert": "antd Alert is an alarm light; Siren is the closest Lucide glyph.",
    "FaWhatsapp": "Brand logo; Lucide has no brand icons, MessageCircle is a generic stand-in. Use the react-icons compatibility set to keep the logo."
  }
}
```

- `icons` maps each old name to its new name. A lowercase value is a **semantic name**; a
  PascalCase value is a **Lucide name**. Every value resolves in Lowdefy v7.
- `review` lists the entries where the new glyph is a judgement call or a known loss (filled
  and two-tone glyphs become outline, brand logos become generic glyphs, file-type glyphs such
  as Word/PDF/Excel become generic file glyphs). The rewrite still applies; the author reviews
  the result.
- The table covers every Ant Design name in react-icons (`AiOutline*`, `AiFill*`, `AiTwotone*`),
  every `Lu*` name, and the names from other packs seen in real apps.

**Load the table and apply it with a script** (Node is available in every Lowdefy project).
Apps often have thousands of icon occurrences; do not rewrite them by hand.

## What to Do

### 1. Find every icon name occurrence

An icon name is always a **whole string value**. Match a name only as a whole token:

```
\b(Ai|Bi|Bs|Cg|Ci|Di|Fa|Fc|Fi|Gi|Go|Gr|Hi|Im|Io|Lia|Lu|Md|Pi|Ri|Rx|Si|Sl|Tb|Tfi|Ti|Vsc|Wi)[A-Z0-9][A-Za-z0-9]*\b
\b[A-Z][A-Za-z]*(Outlined|Filled|TwoTone)\b
```

Look in all of these places:

| Where                                                                                              | Example                                                                                                          |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| YAML config (`.yaml`, `.yml`)                                                                      | `icon: AiOutlineEdit`, `name: AiOutlineHome`, `- AiOutlineUser`                                                  |
| Nunjucks templates (`.njk`, `.yaml.njk`)                                                           | `icon: AiOutlineSave` — these often do not parse as YAML, so treat them as text                                  |
| JSON files (`.json`)                                                                               | `"icon": "AiOutlineUser"`                                                                                        |
| `_js` code strings                                                                                 | `return 'AiOutlineCheck'` or `return "AiOutlineCheck"` inside `_js:` blocks and `.js` files referenced by `_ref` |
| HTML strings                                                                                       | `<span data-icon="AiOutlineUser"></span>`                                                                        |
| Local plugin JS (custom blocks/actions)                                                            | string literals `'AiOutlineUser'` and `meta.icons: ['AiOutlineUser']`                                            |
| `theme.icons.aliases` targets                                                                      | `invoice: LuReceipt`                                                                                             |
| `theme.icons.include`                                                                              | `- AiOutlineFlag`                                                                                                |
| Enum/global maps, `_if`/`_get` branches, module vars, request pipelines (`$switch` `then:` values) | `then: AiOutlineCheckCircle`                                                                                     |

Skip `node_modules/`, `.lowdefy/`, `.git/` and build output folders.

### 2. Rewrite each name with the table

For each match that is a key of `table.icons`, replace the name with its value, preserving the
surrounding text exactly (quotes, indentation, YAML style).

- **Prefer semantic names.** The table already chooses a semantic name wherever one means
  exactly the same thing (`AiOutlineDelete` → `delete`, `AiOutlineHome` → `home`,
  `AiOutlinePlusCircle` → `add-circle`). Keep them; do not expand them to Lucide names.
- **Stale Ant Design names** (`HomeOutlined`, `CheckOutlined`, `UserOutlined`, …) are in the
  table too and map to semantic names where one fits. Only rewrite them where they are string
  values in config or string literals. **Never** rewrite identifiers in JS `import` statements
  or JSX (e.g. `import { HomeOutlined } from '@ant-design/icons'`) — those are real components.
- **`Lu*` names** map by dropping `Lu`, normalised to Lucide's current canonical name
  (`LuPencil` → `Pencil`, `LuTrash2` → `Trash`, `LuFilter` → `Funnel`). The table has all of
  them.
- **`theme.icons.aliases` targets must stay set or qualified names**, never semantic names
  (an alias cannot point at another semantic name). When the table gives a semantic value for
  an alias target, write the semantic name's Lucide target instead (see the list below), e.g.
  `invoice: AiOutlineFileText` → `invoice: FileText`, `trash: LuTrash2` → `trash: Trash`.
- **Names not in the table.** Do not guess. Find the Lucide icon that matches by meaning (the
  v7 dev server serves `GET /lowdefy-docs/icons?q=<words>` and the MCP tool
  `lowdefy_search_icons`; or search https://lucide.dev/icons) and use its PascalCase name.
  If nothing fits, leave the name and list it in the report — it can keep working through the
  compatibility set.

Semantic names and their Lucide targets (needed for `theme.icons.aliases` targets):

```
add Plus · add-circle CirclePlus · arrow-down ArrowDown · arrow-left ArrowLeft · arrow-right ArrowRight
arrow-up ArrowUp · attach Paperclip · bell Bell · bold Bold · bot Bot · calendar Calendar · camera Camera
chart ChartColumn · check Check · check-circle CircleCheck · chevron-down ChevronDown
chevron-left ChevronLeft · chevron-right ChevronRight · chevron-up ChevronUp · chevrons-left ChevronsLeft
chevrons-right ChevronsRight · clear CircleX · clock Clock · close X · close-circle CircleX · copy Copy
delete Trash · document FileText · download Download · drag GripVertical · edit Pencil · error CircleX
external-link ExternalLink · file File · filter Funnel · folder Folder · globe Globe · grid LayoutGrid
heart Heart · help CircleQuestionMark · hide EyeOff · highlight Highlighter · history RotateCcwClock
home House · image Image · info Info · italic Italic · link Link · list List · loading LoaderCircle
location MapPin · lock Lock · login LogIn · logout LogOut · mail Mail · menu Menu · message MessageSquare
minus Minus · more Ellipsis · more-vertical EllipsisVertical · phone Phone · print Printer
refresh RefreshCw · remove CircleMinus · save Save · search Search · send Send · settings Settings
share Share2 · sidebar-collapse PanelLeftClose · sidebar-expand PanelLeftOpen · sort ArrowUpDown
star Star · strikethrough Strikethrough · success CircleCheck · tag Tag · unlock LockOpen · upload Upload
user User · users Users · view Eye · warning TriangleAlert
```

### 3. Report what needs a human

Do not change data, and do not change anything in this step. Produce a report with:

1. **Review entries.** Every rewritten name that is a key of `table.review`: old name, new
   name, the review note, and each file (and line) it was rewritten in. Group by old name.
2. **Unmapped names.** Every icon-like name found that is not in the table, with its locations.
3. **Runtime-only icon sources.** Icon positions whose value comes from data rather than
   config, so no text rewrite can reach it:

   - `icon:`, `name:` (Icon block), `prefixIcon:`, `suffixIcon:` and other `*Icon:` properties,
     menu link `icon:` and HTML `data-icon` values that are `_state`, `_payload`,
     `_request`, `_input`, `_url_query`, `_user`, `_global` or `_get` with `from:` one of those;
   - request pipelines (for example MongoDB `$switch`, `$cond`, `$project`) that return an
     icon field built from document fields rather than literals;
   - enum lists used as an icon picker whose chosen value is saved to a database.

   For each, note that stored or computed icon names must either be migrated in the data
   (outside this codemod, using the same table) or keep working through the compatibility set,
   and that names only known at runtime must be listed in `theme.icons.include` so the build
   bundles them.

4. **Direct react-icons imports in local plugins** (`import … from 'react-icons/…'`). These
   stop working in v7 because react-icons is no longer installed. The plugin should render
   `components.Icon` with a semantic or Lucide name instead (and list the names in the
   block's `meta.icons`), or import from `lucide-react` directly.
5. **Totals:** files changed, occurrences rewritten, how many to semantic names and how many
   to Lucide names.

## Fallback: the react-icons Compatibility Set

`@lowdefy/icons-react-icons` is an icon-set plugin holding every react-icons 5.6.0 icon under
its old name. Recommend it in the report when the app:

- stores icon names in a database (names users picked, records with an `icon` field),
- needs brand logos Lucide does not have (`FaWhatsapp`, `AiOutlineGithub`, `SiStripe`, …), or
- has unmapped names that should keep their exact glyph.

```yaml
plugins:
  - name: '@lowdefy/icons-react-icons'
    version: 7.0.0

theme:
  icons:
    set: react-icons # old names resolve unqualified, Lucide and semantic names keep working
```

Without `theme.icons.set: react-icons`, old names still resolve when qualified:
`react-icons:AiOutlineUser`. A single brand logo can therefore be kept with
`icon: react-icons:FaWhatsapp` while the rest of the app moves to Lucide.

## Examples

### Before

```yaml
- id: save_button
  type: Button
  properties:
    title: Save
    icon: AiOutlineSave
- id: breadcrumb
  type: Breadcrumb
  properties:
    list:
      - label: Home
        icon: AiOutlineHome
        pageId: home
      - label: Contacts
        icon: AiOutlineContacts
- id: status_icon
  type: Icon
  properties:
    name:
      _if:
        test:
          _state: done
        then: AiFillCheckCircle
        else: AiOutlineClockCircle
- id: legacy
  type: Button
  properties:
    icon: HomeOutlined
```

### After

```yaml
- id: save_button
  type: Button
  properties:
    title: Save
    icon: save
- id: breadcrumb
  type: Breadcrumb
  properties:
    list:
      - label: Home
        icon: home
        pageId: home
      - label: Contacts
        icon: Contact
- id: status_icon
  type: Icon
  properties:
    name:
      _if:
        test:
          _state: done
        then: check-circle
        else: clock
- id: legacy
  type: Button
  properties:
    icon: home
```

`AiFillCheckCircle` is a `review` entry (filled glyph becomes outline), so it goes in the report.

### `_js` and local plugins

```yaml
# Before
icon:
  _js: |
    return state.approved ? 'AiOutlineCheck' : "AiOutlineClose";
# After
icon:
  _js: |
    return state.approved ? 'check' : "close";
```

```javascript
// Before — local plugin block
MyBlock.meta = { category: 'display', icons: ['AiOutlineUser', 'LuPencil'] };
// After
MyBlock.meta = { category: 'display', icons: ['user', 'Pencil'] };
```

### `theme.icons.aliases`

```yaml
# Before
theme:
  icons:
    aliases:
      invoice: LuReceipt
      remove-row: AiOutlineDelete
# After — targets stay Lucide names
theme:
  icons:
    aliases:
      invoice: Receipt
      remove-row: Trash
```

## Edge Cases

- **Block `type:` values are not icons.** Lucide has icons named like some block types
  (`Anchor`, `Badge`, `Calendar`, `Menu`, `Tag`, …). Only rewrite names that match the patterns
  above; never touch `type:` values.
- **Names inside prose** (descriptions, markdown, help text) that mention an icon for a human
  reader can be rewritten too, but list them in the report rather than assuming.
- **Duplicate meaning after rewrite.** Different old names can map to the same new name
  (`AiOutlineClockCircle` and `AiOutlineFieldTime` both relate to time). That is expected.
- **Tests and snapshots** in local plugins that assert old icon names need the same rewrite.
- **Data stays untouched.** Never modify database documents, seed files that are loaded into a
  database at runtime, or fixtures, unless the author asks; list them in the report instead.

## Verification

1. No react-icons names or stale Ant Design names remain in config (the only allowed matches
   are ones deliberately qualified as `react-icons:…`, listed in the report, or inside JS
   `import` statements for `@ant-design/icons`):

   ```
   grep -rnE '\b(Ai|Bi|Bs|Cg|Ci|Di|Fa|Fc|Fi|Gi|Go|Gr|Hi|Im|Io|Lia|Lu|Md|Pi|Ri|Rx|Si|Sl|Tb|Tfi|Ti|Vsc|Wi)[A-Z0-9][A-Za-z0-9]*\b|\b[A-Z][A-Za-z]*(Outlined|Filled|TwoTone)\b' \
     --include='*.yaml' --include='*.yml' --include='*.njk' --include='*.json' --include='*.js' \
     --exclude-dir=node_modules --exclude-dir=.lowdefy .
   ```

2. Run `lowdefy build`. Any icon name that still does not resolve fails the build with its
   config location and a suggestion; fix each one with the table or a Lucide search.
