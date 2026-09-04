# Search

A full-text search command palette (Cmd+K / Ctrl+K) with keyboard navigation, result highlighting, and grouped results. Uses [MiniSearch](https://lucaong.github.io/minisearch/) for the search engine and antd Modal for the overlay. Two ways to provide data: pre-built index file via `indexUrl` (generated at build time, best for static content), or runtime `documents` array (indexed client-side, good for dynamic content). See the guide and examples below.

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

```yaml
- id: example_search_prebuilt
  type: Search
  properties:
    indexUrl: /search-index.json
    placeholder: Search pages...
    result:
      title: title
      description: snippet
      category: section
      pageId: pageId
    groups:
      - label: Concepts
        match:
          section: Concepts
        icon: AiOutlineBulb
      - label: Blocks
        match:
          section: Blocks
        icon: AiOutlineLayout
  events:
    onSelect:
      - id: navigate
        type: Link
        params:
          pageId:
            _event: pageId
```

```yaml
- id: example_search_prebuilt
  type: Search
  properties:
    indexUrl: /search-index.json
    placeholder: Search pages...
    result:
      title: title
      description: snippet
      category: section
      pageId: pageId
    groups:
      - label: Concepts
        match:
          section: Concepts
        icon: AiOutlineBulb
      - label: Blocks
        match:
          section: Blocks
        icon: AiOutlineLayout
  events:
    onSelect:
      - id: navigate
        type: Link
        params:
          pageId:
            _event: pageId
```

```yaml
- id: example_search_runtime
  type: Search
  properties:
    documents:
      - id: users
        title: User Management
        body: Create, edit, and deactivate user accounts. Assign roles and permissions.
        category: Admin
      - id: billing
        title: Billing & Invoices
        body: View invoices, update payment methods, and download receipts.
        category: Finance
      - id: reports
        title: Analytics Reports
        body: Dashboard with charts for revenue, signups, and engagement metrics.
        category: Analytics
      - id: settings
        title: App Settings
        body: Configure notifications, theme, language, and integration API keys.
        category: Admin
      - id: api-keys
        title: API Keys
        body: Generate and revoke API keys for third-party integrations.
        category: Admin
    fields:
      - title
      - body
    storeFields:
      - title
      - category
      - id
    searchOptions:
      boost:
        title: 2
      fuzzy: 0.2
    result:
      title: title
      description: body
      category: category
    groups:
      - label: Admin
        match:
          category: Admin
        icon: AiOutlineSetting
      - label: Finance
        match:
          category: Finance
        icon: AiOutlineDollar
      - label: Analytics
        match:
          category: Analytics
        icon: AiOutlineBarChart
    placeholder: Search features...
    label: Find
    shortcut: mod+k
  events:
    onSelect:
      - id: show_result
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - "Selected: "
              - _event: title
```

```yaml
- id: example_search_runtime
  type: Search
  properties:
    documents:
      - id: users
        title: User Management
        body: Create, edit, and deactivate user accounts. Assign roles and permissions.
        category: Admin
      - id: billing
        title: Billing & Invoices
        body: View invoices, update payment methods, and download receipts.
        category: Finance
      - id: reports
        title: Analytics Reports
        body: Dashboard with charts for revenue, signups, and engagement metrics.
        category: Analytics
      - id: settings
        title: App Settings
        body: Configure notifications, theme, language, and integration API keys.
        category: Admin
      - id: api-keys
        title: API Keys
        body: Generate and revoke API keys for third-party integrations.
        category: Admin
    fields:
      - title
      - body
    storeFields:
      - title
      - category
      - id
    searchOptions:
      boost:
        title: 2
      fuzzy: 0.2
    result:
      title: title
      description: body
      category: category
    groups:
      - label: Admin
        match:
          category: Admin
        icon: AiOutlineSetting
      - label: Finance
        match:
          category: Finance
        icon: AiOutlineDollar
      - label: Analytics
        match:
          category: Analytics
        icon: AiOutlineBarChart
    placeholder: Search features...
    label: Find
    shortcut: mod+k
  events:
    onSelect:
      - id: show_result
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - "Selected: "
              - _event: title
```

```yaml
- id: example_search_custom_shortcut
  type: Search
  properties:
    indexUrl: /search-index.json
    shortcut: mod+j
    label: Quick Find
    placeholder: Quick find...
  events:
    onSelect:
      - id: navigate
        type: Link
        params:
          pageId:
            _event: pageId
```

```yaml
- id: example_search_custom_shortcut
  type: Search
  properties:
    indexUrl: /search-index.json
    shortcut: mod+j
    label: Quick Find
    placeholder: Quick find...
  events:
    onSelect:
      - id: navigate
        type: Link
        params:
          pageId:
            _event: pageId
```

```yaml
- id: example_search_analytics
  type: Search
  properties:
    indexUrl: /search-index.json
  events:
    onSearch:
      - id: track_search
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - 'Search: "'
              - _event: value
              - '" ('
              - _event: resultCount
              - " results)"
    onSelect:
      - id: track_click
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - Clicked "
              - _event: title
              - '" for query "'
              - _event: query
              - '"'
      - id: navigate
        type: Link
        params:
          pageId:
            _event: pageId
```

```yaml
- id: example_search_analytics
  type: Search
  properties:
    indexUrl: /search-index.json
  events:
    onSearch:
      - id: track_search
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - 'Search: "'
              - _event: value
              - '" ('
              - _event: resultCount
              - " results)"
    onSelect:
      - id: track_click
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - Clicked "
              - _event: title
              - '" for query "'
              - _event: query
              - '"'
      - id: navigate
        type: Link
        params:
          pageId:
            _event: pageId
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `indexUrl` | string \| array | - | URL or array of URLs to pre-built search index JSON files. |
| `documents` | array | - | Array of document objects for client-side indexing. |
| `fields` | array | - | Fields to index. Required when using documents, optional for indexUrl. |
| `storeFields` | array | - | Fields to store in the index and return in results. |
| `searchOptions` | object | - | MiniSearch search options. |
| `searchOptions.boost` | object | - | Field boost factors for relevance scoring. |
| `searchOptions.fuzzy` | number | - | Fuzzy matching tolerance as a fraction of term length (0 to 1). |
| `searchOptions.prefix` | boolean | `true` | Enable prefix matching. |
| `searchOptions.combineWith` | string | `"OR"` | How to combine search terms. Enum: `OR`, `AND`. |
| `label` | string | `"Search"` | Trigger button text. |
| `showShortcut` | boolean | `true` | Show keyboard shortcut badge on the trigger button. |
| `placeholder` | string | `"Search..."` | Search input placeholder text. |
| `shortcut` | string | `"mod+k"` | Keyboard shortcut to open the modal. Renders a shortcut badge on the trigger button (see showShortcut). Use "mod" for Cmd on Mac, Ctrl elsewhere. |
| `width` | number | `640` | Modal width in pixels. |
| `maxResults` | number | `20` | Maximum number of results displayed. |
| `result` | object | - | Maps index fields to result UI slots. |
| `result.title` | string | `"title"` | Field name for result title. |
| `result.description` | string | - | Field name for result description/snippet. |
| `result.category` | string | - | Field name for result grouping category. |
| `result.icon` | string | - | Field name for result icon name. |
| `result.pageId` | string | - | Field name for Lowdefy page navigation. |
| `result.url` | string | - | Field name for external URL navigation. |
| `groups` | array | - | Result grouping definitions. |
| `groups.$.label` | string | - | Group display label. |
| `groups.$.match` | object | - | Field/value pairs to match results to this group. |
| `groups.$.icon` | string | - | Icon for the group header. |
| `noResultsMessage` | string | `"No results found."` | Message shown when no results match. |
| `highlightMatches` | boolean | `true` | Highlight matched terms in results. |
| `recentSearches` | boolean | `true` | Show recent searches when input is empty. |
| `recentSearchesKey` | string | `"search"` | localStorage key prefix for recent searches. |
| `recentSearchesCount` | number | `5` | Maximum number of recent searches stored. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). |

| Event | Event Data | Description |
| --- | --- | --- |
| `onSelect` | `{ query: string, resultCount: integer }` | Trigger actions when a search result is selected. Result item stored fields are spread into the event object. |
| `onSearch` | `{ value: string, resultCount: integer }` | Trigger actions when the search query changes. |
| `onOpen` | \- | Trigger actions when the search modal opens. |
| `onClose` | \- | Trigger actions when the search modal closes. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The search trigger button and modal root. |
| `/trigger` | The trigger button. |
| `/triggerBadge` | The keyboard shortcut badge on the trigger. |
| `/modal` | The antd Modal container. |
| `/input` | The search input field. |
| `/results` | The scrollable results list. |
| `/group` | A result group container. |
| `/groupHeading` | A group heading label. |
| `/item` | A result item row. |
| `/itemIcon` | The icon in a result item. |
| `/itemTitle` | The title in a result item. |
| `/itemDescription` | The description/snippet in a result item. |
| `/highlight` | Highlighted match text (<mark> elements). |
| `/empty` | The empty state message. |
| `/loading` | The loading spinner container. |

No slots defined.
