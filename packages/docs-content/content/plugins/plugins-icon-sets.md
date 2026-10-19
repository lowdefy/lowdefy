# Icon Sets

Lowdefy draws icons with [Lucide](https://lucide.dev). An icon-set plugin adds icons as data: a whole set such as Tabler, a few icons of your own, or replacements for Lucide icons. Blocks, Ant Design components and HTML `data-icon` all draw set icons the same way as Lucide icons, with the app's `size`, `strokeWidth` and colour.

An icon set holds no React code. Each icon is a plain object that describes its SVG, and the build writes only the icons an app uses into the app bundle.

## Declare a set

A set has an id in lowercase kebab-case, such as `tabler`. The id is a namespace, so a plugin's `typePrefix` does not change it. Declare it in `types.js` under `iconSets`:

```js
// src/types.js
export default {
  iconSets: ['tabler'],
};
```

Export the set from a `./iconSets` entry point:

```json
{
  "name": "@my-app/icons-tabler",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    "./iconSets": "./src/iconSets.js",
    "./types": "./src/types.js"
  },
  "files": ["src/*"]
}
```

The `./iconSets` module runs only in Node, during the build and in the dev server. It exports an object with one entry per set id:

```js
// src/iconSets.js
export default {
  tabler: {
    attrs: undefined,
    semantic: { edit: 'Pencil', delete: 'Trash' },
    listIcons: async () => ['Pencil', 'Trash' /* ... */],
    loadIcons: async ({ names }) => ({
      Pencil: {
        node: [
          /* ... */
        ],
      },
    }),
  },
};
```

| Key         | Required | Description                                                                                                                                   |
| ----------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `listIcons` | Yes      | An async function that returns every icon name in the set. Search (`lowdefy_search_icons`) and the build's "did you mean" suggestions use it. |
| `loadIcons` | Yes      | An async function that takes `{ names }` and returns `{ [name]: IconData }` for the names it has. Leave out names it does not have.           |
| `attrs`     | No       | Root SVG attributes added to every icon of this set, such as `{ fill: 'currentColor', stroke: 'none' }` for a fill-based set.                 |
| `semantic`  | No       | A map from semantic names to icon names in this set. It applies when this set is the app's default set (`theme.icons.set`).                   |

The build calls `loadIcons` only with names the app uses, so a large set costs nothing until an app draws one of its icons.

Install the plugin like any other plugin. A set in the same pnpm workspace uses `workspace:*`:

```yaml
plugins:
  - name: '@my-app/icons-tabler'
    version: 'workspace:*'
```

Restart the dev server after you add an icon-set plugin.

## Icon names

Icon names in a set are PascalCase: `Pencil`, `ArrowLeftRight`. Convert kebab-case file names when you build the set. An app writes a set icon in one of two ways:

- `tabler:Pencil` — a qualified name. It resolves only in the `tabler` set.
- `Pencil` — a set name. It resolves in the app's default set (`theme.icons.set`, which is `lucide` unless the app changes it), then in Lucide.

## IconData

`loadIcons` returns each icon as `IconData`:

```js
{
  node: [
    ['path', { d: 'M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4' }],
    ['path', { d: 'M13.5 6.5l4 4' }],
  ],
  size: 24,
}
```

| Key               | Description                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| `node`            | Required. An array of `[tag, attrs, children?]`. `children` is another node array, so groups nest. |
| `size`            | The viewBox size of a square icon: `size: 24` gives `viewBox="0 0 24 24"`. Defaults to 24.         |
| `width`, `height` | Use these instead of `size` for an icon that is not square.                                        |
| `attrs`           | Root SVG attributes for this icon.                                                                 |

Rules for the data:

- Attribute names are React names: `strokeWidth`, `fillRule`, `clipRule`, `className`, not `stroke-width` or `class`.
- The viewBox always starts at `0 0`. For a source with an offset viewBox such as `-2 -2 24 24`, wrap the nodes in `['g', { transform: 'translate(2 2)' }, nodes]`.
- Root `attrs` never set `strokeWidth`. Stroke width is an app setting (`theme.icons.strokeWidth`), so every set follows it. A set drawn at 1.5, such as Heroicons, should tell apps to set `theme.icons.strokeWidth: 1.5`. A `strokeWidth` on a single node inside `node` is fine.
- Leave out `key` attributes.

Every icon starts from Lucide's root attributes: `fill="none"`, `stroke="currentColor"`, round line caps and joins, and the app's stroke width. Stroke sets on a 24px grid, such as Tabler outline and `@lucide/lab`, need no `attrs`. A fill-based set sets `attrs: { fill: 'currentColor', stroke: 'none' }`. Draw with `currentColor`, so the icon's `color` works.

## Layers: the last plugin wins

Several plugins can declare the same set id. Each one adds a layer to the set, in `plugins` order. For `lucide`, Lowdefy's built-in Lucide data is the bottom layer.

- **Per icon name, the topmost layer that has it wins.** A layer can be partial. A name it lacks falls through to the layers below it.
- **`semantic` maps layer the same way.** From lowest to highest precedence: the built-in semantic names, then the `semantic` maps of the default set's layers in plugin order, then the app's `theme.icons.aliases`.
- **Qualified names stay in their set.** `tabler:Pencil` resolves through the `tabler` layers only. If no layer has it, it is unresolved, and the build fails at an icon property. It does not fall back to Lucide.

### Add one icon to Lucide

A plugin that declares `lucide` and has one icon makes that name work like any Lucide name, without a set prefix:

```js
// types.js
export default { iconSets: ['lucide'] };
```

```js
// iconSets.js
const Invoice = {
  node: [
    ['path', { d: 'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z' }],
    ['path', { d: 'M8 8h8' }],
    ['path', { d: 'M8 12h8' }],
    ['path', { d: 'M8 16h5' }],
  ],
};

export default {
  lucide: {
    listIcons: async () => ['Invoice'],
    loadIcons: async ({ names }) => (names.includes('Invoice') ? { Invoice } : {}),
  },
};
```

```yaml
- id: invoice_button
  type: Button
  properties:
    title: Invoices
    icon: Invoice
```

### Replace an icon

A layer that defines a name Lucide already has replaces it everywhere. If the layer above defines `Pencil`, every `Pencil` in the app draws the new glyph, and so do the semantic `edit` and every block that uses `edit`.

## Select a set

`theme.icons.set` makes a set the app's default set:

```yaml
theme:
  icons:
    set: tabler
```

- PascalCase names resolve in the Tabler layers first, then in Lucide. Every Lucide name keeps working.
- The Tabler layers' `semantic` maps override the built-in semantic names. So the set re-skins block icons and Ant Design icons (close buttons, alert status icons, select arrows) as far as its map covers them. Semantic names it leaves out keep their Lucide icons.
- The app's `theme.icons.aliases` still win over both.

`theme.icons.set` must name the built-in `lucide` set or an installed set, or the build fails.

## Example: Tabler outline icons

[Tabler](https://tabler.io/icons) outline icons use the same 24px grid and stroke attributes as Lucide. The `@tabler/icons` package ships them as node arrays in `tabler-nodes-outline.json`, keyed by kebab-case name. Convert them once, when you build the plugin package, and read the JSON in `iconSets.js`.

```js
// scripts/convertIcons.js - run with `node scripts/convertIcons.js`
import fs from 'fs';

const source = new URL('../node_modules/@tabler/icons/tabler-nodes-outline.json', import.meta.url);
const target = new URL('../src/tablerOutline.json', import.meta.url);

function toPascalCase(name) {
  return name
    .split('-')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');
}

const nodes = JSON.parse(fs.readFileSync(source, 'utf8'));
const icons = {};
Object.entries(nodes).forEach(([name, node]) => {
  icons[toPascalCase(name)] = { node };
});
fs.writeFileSync(target, JSON.stringify(icons));
```

`pencil` becomes `Pencil`, and `arrow-left-right` becomes `ArrowLeftRight`. The file already leaves out Tabler's invisible bounding-box path, and its attributes are React names, so it needs no other changes.

```js
// src/iconSets.js
import { readFile } from 'fs/promises';

let iconsPromise;

function readIcons() {
  iconsPromise ??= readFile(new URL('./tablerOutline.json', import.meta.url), 'utf8').then(
    JSON.parse
  );
  return iconsPromise;
}

async function listIcons() {
  return Object.keys(await readIcons());
}

async function loadIcons({ names }) {
  const icons = await readIcons();
  const found = {};
  names.forEach((name) => {
    if (icons[name]) found[name] = icons[name];
  });
  return found;
}

export default {
  tabler: {
    semantic: {
      add: 'Plus',
      close: 'X',
      delete: 'Trash',
      edit: 'Pencil',
      search: 'Search',
      settings: 'Settings',
    },
    listIcons,
    loadIcons,
  },
};
```

```js
// src/types.js
export default { iconSets: ['tabler'] };
```

An app can now use `tabler:Pencil` anywhere, or set `theme.icons.set: tabler` to draw Tabler icons by default.

## The react-icons compatibility set

Lowdefy 6 and earlier used [react-icons](https://react-icons.github.io/react-icons/) names such as `AiOutlineUser`. `@lowdefy/icons-react-icons` is an icon set, `react-icons`, that holds every react-icons 5.6.0 icon under its old name. Use it when names come from data the build cannot rewrite, such as icon names stored in a database, or for brand icons that Lucide does not have.

```yaml
plugins:
  - name: '@lowdefy/icons-react-icons'
    version: '^7'
theme:
  icons:
    set: react-icons
```

- Old names such as `AiOutlineUser` resolve in the compatibility set. Lucide names and semantic names still work.
- The set has no `semantic` map, so block icons and Ant Design icons are Lucide either way.
- Without `set: react-icons`, reach an old name with its qualified name: `react-icons:FaWhatsapp`.

The compatibility set is a migration aid. [V6 to V7](/v6-to-v7) shows how to move an app to Lucide names.
