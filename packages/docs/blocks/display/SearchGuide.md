## Generating a Search Index

The Search block supports two data sources. For most apps, a **pre-built index file** is the best approach — it's generated once at build time and loaded on-demand when the user opens the search modal.

### Option 1: Pre-built index file (recommended)

Create a JavaScript transformer that runs during `lowdefy build`. It receives all resolved pages, extracts searchable text, builds a [MiniSearch](https://lucaong.github.io/minisearch/) index, and writes it to `public/search-index.json`.

**Step 1 — Write the transformer:**

```javascript
// templates/buildSearchIndex.js
import MiniSearch from 'minisearch';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

function buildSearchIndex(pages) {
  // Extract searchable content from each page
  const documents = pages.filter(Boolean).map((page) => ({
    id: page.id,
    pageId: page.id,
    title: page.properties?.title ?? page.id,
    section: 'Docs', // or derive from menus
    description: '', // extract from page content as needed
  }));

  const miniSearch = new MiniSearch({
    fields: ['title', 'description'],
    storeFields: ['title', 'pageId', 'section'],
  });
  miniSearch.addAll(documents);

  // The index JSON format the Search block expects
  const index = {
    engine: 'minisearch',
    version: 1,
    options: {
      fields: ['title', 'description'],
      storeFields: ['title', 'pageId', 'section'],
      idField: 'id',
    },
    searchDefaults: {
      boost: { title: 2 },
      fuzzy: 0.2,
      prefix: true,
    },
    resultDefaults: {
      title: 'title',
      description: 'description',
      pageId: 'pageId',
    },
    data: JSON.parse(JSON.stringify(miniSearch)),
  };

  const dir = path.join(dirname(fileURLToPath(import.meta.url)), '../public');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'search-index.json'), JSON.stringify(index));
}

export default buildSearchIndex;
```

**Step 2 — Wire it into lowdefy.yaml:**

```yaml
# lowdefy.yaml
pages:
  _ref:
    path: pages.yaml
    transformer: templates/buildSearchIndex.js
```

The transformer runs during every build. The output file (`public/search-index.json`) is served as a static asset and fetched by the Search block when the modal opens.

**Step 3 — Add the Search block:**

```yaml
- id: site_search
  type: Search
  properties:
    indexUrl: /search-index.json
  events:
    onSelect:
      - id: navigate
        type: Link
        params:
          pageId:
            _event: pageId
```

### Option 2: Runtime documents (no build step)

For small datasets or dynamic content (e.g., from a request), pass documents directly. The block indexes them client-side:

```yaml
- id: feature_search
  type: Search
  properties:
    documents:
      - id: users
        title: User Management
        body: Create, edit, and deactivate user accounts.
        category: Admin
      - id: billing
        title: Billing
        body: View invoices and update payment methods.
        category: Finance
    fields: [title, body]
    storeFields: [title, category, id]
    searchOptions:
      boost:
        title: 2
      fuzzy: 0.2
    result:
      title: title
      description: body
      category: category
```

You can also load documents from a request and pass them via state:

```yaml
properties:
  documents:
    _state: searchDocuments
  fields: [title, body]
  storeFields: [title, id]
```

### Index JSON format

The `indexUrl` JSON file has this structure:

| Key              | Type     | Description                                                                                  |
| ---------------- | -------- | -------------------------------------------------------------------------------------------- |
| `engine`         | `string` | Always `"minisearch"`                                                                        |
| `version`        | `number` | Schema version (currently `1`)                                                               |
| `options`        | `object` | MiniSearch constructor options (`fields`, `storeFields`, `idField`)                          |
| `searchDefaults` | `object` | Default search options (`boost`, `fuzzy`, `prefix`, `combineWith`)                           |
| `resultDefaults` | `object` | Maps index fields to result UI (`title`, `description`, `category`, `pageId`, `url`, `icon`) |
| `groups`         | `array`  | Result grouping definitions (`label`, `match`, `icon`)                                       |
| `data`           | `object` | Serialized MiniSearch index (from `JSON.parse(JSON.stringify(miniSearch))`)                  |

See the [MiniSearch API docs](https://lucaong.github.io/minisearch/classes/MiniSearch.MiniSearch.html) for all available field and search options.
