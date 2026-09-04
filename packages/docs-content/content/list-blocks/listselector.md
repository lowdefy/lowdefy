# ListSelector

Data-driven vertical list of headerless cards that doubles as a single-select input. Each card body is rendered from a Nunjucks template against its row item. Clicking a card sets the block value to that data item and highlights it; set `selectable: false` to turn selection off and render a read-only card list. Virtualized via `react-virtuoso` so thousands of variable-height cards render smoothly, with a memoized row component to skip unnecessary re-renders. Optional client-side search bar filters rows by text across any field paths, a built-in loading skeleton stands in while data loads, and `onChange` / `onClick` events report `{ value, index, item }` for the row that was clicked.

```yaml
- id: basic_card_list
  type: ListSelector
  properties:
    data:
      - Alpha
      - Beta
      - Gamma
    html: |
      <h3>{{ index + 1 }}. {{ item }}</h3>
```

```yaml
basic_card_list:
  _state: basic_card_list
```

Selected:

```yaml
- id: select_list
  type: ListSelector
  properties:
    hoverable: true
    data:
      - id: 1
        name: Starter
        price: $0
      - id: 2
        name: Pro
        price: $20
      - id: 3
        name: Enterprise
        price: $99
    html: |
      <strong>{{ item.name }}</strong>
      <div style="color:#666;">{{ item.price }} / month</div>
  events:
    onChange:
      - id: capture_selected
        type: SetState
        params:
          selected_plan:
            _event: value
- id: selected_plan_display
  type: Paragraph
  properties:
    content:
      _nunjucks:
        template: "Selected: {{ selected_plan.name }}"
        on:
          _state: true
```

```yaml
- id: select_list
  type: ListSelector
  properties:
    hoverable: true
    data:
      - id: 1
        name: Starter
        price: $0
      - id: 2
        name: Pro
        price: $20
      - id: 3
        name: Enterprise
        price: $99
    html: |
      <strong>{{ item.name }}</strong>
      <div style="color:#666;">{{ item.price }} / month</div>
  events:
    onChange:
      - id: capture_selected
        type: SetState
        params:
          selected_plan:
            _event: value
- id: selected_plan_display
  type: Paragraph
  properties:
    content:
      _nunjucks:
        template: "Selected: {{ selected_plan.name }}"
        on:
          _state: true
```

```yaml
select_list:
  _state: select_list
selected_plan_display:
  _state: selected_plan_display
```

```yaml
- id: readonly_list
  type: ListSelector
  properties:
    selectable: false
    data:
      - One
      - Two
      - Three
    html: |
      <span>{{ item }}</span>
```

```yaml
readonly_list:
  _state: readonly_list
```

```yaml
- id: empty_list
  type: ListSelector
  properties:
    data: []
    noData: No people to show yet.
    html: |
      <span>{{ item.name }}</span>
```

```yaml
empty_list:
  _state: empty_list
```

```yaml
- id: people_card_list
  type: ListSelector
  properties:
    hoverable: true
    bordered: false
    data:
      - name: Ada Lovelace
        email: ada@example.com
        role: Mathematician
      - name: Linus Torvalds
        email: linus@example.com
        role: Engineer
      - name: Grace Hopper
        email: grace@example.com
        role: Computer Scientist
    html: |
      <div style="display:flex; flex-direction:column; gap:4px;">
        <strong>{{ item.name }}</strong>
        <span style="color:#666;">{{ item.role }}</span>
        <a href="mailto:{{ item.email }}">{{ item.email }}</a>
      </div>
```

```yaml
people_card_list:
  _state: people_card_list
```

```yaml
- id: click_card_list
  type: ListSelector
  properties:
    hoverable: true
    data:
      - id: 1
        label: First
      - id: 2
        label: Second
      - id: 3
        label: Third
    html: |
      <h4>{{ item.label }}</h4>
      <p>Click to see which row was selected.</p>
  events:
    onClick:
      - id: capture_clicked
        type: SetState
        params:
          clicked_card:
            _event: true
```

```yaml
- id: click_card_list
  type: ListSelector
  properties:
    hoverable: true
    data:
      - id: 1
        label: First
      - id: 2
        label: Second
      - id: 3
        label: Third
    html: |
      <h4>{{ item.label }}</h4>
      <p>Click to see which row was selected.</p>
  events:
    onClick:
      - id: capture_clicked
        type: SetState
        params:
          clicked_card:
            _event: true
```

```yaml
click_card_list:
  _state: click_card_list
```

```yaml
- id: compact_card_list
  type: ListSelector
  properties:
    size: small
    gap: 4
    data:
      - One
      - Two
      - Three
      - Four
    html: |
      <span>{{ item }}</span>
```

```yaml
compact_card_list:
  _state: compact_card_list
```

```yaml
- id: large_card_list
  type: ListSelector
  properties:
    hoverable: true
    height: 480
    data:
      _string.split:
        on:
          _string.repeat:
            on: x,
            count: 999
        separator: ","
    html: >
      <h4>Row {{ index + 1 }}</h4>

      <p>This list renders one thousand cards. Only rows in (and near) the
      viewport are mounted in the DOM.</p>
```

```yaml
- id: large_card_list
  type: ListSelector
  properties:
    hoverable: true
    height: 480
    data:
      _string.split:
        on:
          _string.repeat:
            on: x,
            count: 999
        separator: ","
    html: >
      <h4>Row {{ index + 1 }}</h4>

      <p>This list renders one thousand cards. Only rows in (and near) the
      viewport are mounted in the DOM.</p>
```

```yaml
large_card_list:
  _state: large_card_list
```

```yaml
- id: search_all_card_list
  type: ListSelector
  properties:
    hoverable: true
    height: 360
    search: {}
    data:
      - name: Ada Lovelace
        email: ada@example.com
        role: Mathematician
      - name: Linus Torvalds
        email: linus@example.com
        role: Engineer
      - name: Grace Hopper
        email: grace@example.com
        role: Computer Scientist
      - name: Alan Turing
        email: alan@example.com
        role: Mathematician
      - name: Margaret Hamilton
        email: margaret@example.com
        role: Software Engineer
    html: >
      <strong>{{ item.name }}</strong>

      <div style="color:#666;">{{ item.role }} · <a href="mailto:{{ item.email
      }}">{{ item.email }}</a></div>
```

```yaml
search_all_card_list:
  _state: search_all_card_list
```

```yaml
- id: search_fields_card_list
  type: ListSelector
  properties:
    hoverable: true
    height: 360
    search:
      placeholder: Filter by name…
      fields:
        - name
      minLength: 1
    data:
      - name: Ada Lovelace
        email: ada@example.com
        role: Mathematician
      - name: Linus Torvalds
        email: linus@example.com
        role: Engineer
      - name: Grace Hopper
        email: grace@example.com
        role: Computer Scientist
    html: |
      <strong>{{ item.name }}</strong>
      <div style="color:#666;">{{ item.role }}</div>
```

```yaml
search_fields_card_list:
  _state: search_fields_card_list
```

Selected plan id: —

```yaml
- id: keyed_list
  type: ListSelector
  properties:
    valueKey: id
    primaryKey: id
    data:
      - id: 1
        name: Starter
        price: $0
      - id: 2
        name: Pro
        price: $20
      - id: 3
        name: Enterprise
        price: $99
    html: |
      <strong>{{ item.name }}</strong>
      <div style="color:#888;">{{ item.price }} / month</div>
  events:
    onChange:
      - id: capture_keyed
        type: SetState
        params:
          keyed_plan_id:
            _event: value
- id: keyed_plan_display
  type: Paragraph
  properties:
    content:
      _nunjucks:
        template: 'Selected plan id: {{ keyed_plan_id if keyed_plan_id != null else "—"
          }}'
        on:
          _state: true
```

```yaml
- id: keyed_list
  type: ListSelector
  properties:
    valueKey: id
    primaryKey: id
    data:
      - id: 1
        name: Starter
        price: $0
      - id: 2
        name: Pro
        price: $20
      - id: 3
        name: Enterprise
        price: $99
    html: |
      <strong>{{ item.name }}</strong>
      <div style="color:#888;">{{ item.price }} / month</div>
  events:
    onChange:
      - id: capture_keyed
        type: SetState
        params:
          keyed_plan_id:
            _event: value
- id: keyed_plan_display
  type: Paragraph
  properties:
    content:
      _nunjucks:
        template: 'Selected plan id: {{ keyed_plan_id if keyed_plan_id != null else "—"
          }}'
        on:
          _state: true
```

```yaml
keyed_list:
  _state: keyed_list
keyed_plan_display:
  _state: keyed_plan_display
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | array | `[]` | Array of items. Each item is rendered as one card by passing it to the html Nunjucks template as `item`. |
| `html` | string | - | Nunjucks template used to render the body of each card. The context exposes `item` (the current data row) and `index` (the zero-based row index). |
| `selectable` | boolean | `true` | Enable selecting a card. When true, clicking a card sets the block value to that data item and highlights it. When false, the block is a read-only card list that stores no value. |
| `allowDeselect` | boolean | `true` | Allow clicking the selected card again to clear the selection (sets the value to null). Ignored when `selectable` is false. |
| `valueKey` | string | - | Field of each data item stored as the block value when a card is selected (e.g. "id"). Omit to store the whole item. Lets the selection be driven with SetState using a simple key. Supports dotted paths. |
| `primaryKey` | string | - | Field used to match the current value (e.g. set with SetState) back to a card for highlighting. Defaults to `valueKey`. Set this when the stored value is the whole item but a single field (e.g. "id") uniquely identifies it. Supports dotted paths. |
| `bordered` | boolean | `true` | Toggles the border around each card. |
| `hoverable` | boolean | `false` | Lift each card up when hovered. |
| `size` | string | `"default"` | Card size. Enum: `default`, `small`. |
| `gap` | number | `8` | Pixel gap between cards. |
| `height` | number \| string | - | Optional pixel height (number) or CSS height string of the scroll container. When omitted, the list scrolls with the page. |
| `overscan` | number | `400` | Pixels of off-screen rows to render above and below the viewport. Increase for smoother fast-scroll, decrease to reduce DOM cost. |
| `noData` | string | - | Text shown in place of the list when the `data` array is empty. Defaults to the `blocks.listSelector.noData` message ("No data"). |
| `search` | object | - | Optional client-side search bar above the list. When this property is set, a debounced search input filters rows by text. Omit to hide the bar. |
| `search.placeholder` | string | `"Search…"` | Placeholder text in the input. |
| `search.fields` | array | - | Dotted field paths to match against (e.g. "user.name"). When omitted, every field path is searched (whole-item stringify). |
| `search.caseSensitive` | boolean | `false` | Match case exactly. |
| `search.debounce` | number | `150` | Milliseconds to wait after the last keystroke before filtering. |
| `search.sticky` | boolean | `true` | Stick the search bar to the top while scrolling. |
| `search.allowClear` | boolean | `true` | Show a clear (×) icon in the input. |
| `search.minLength` | number | `0` | Skip filtering until the query is at least this many characters. |
| `search.noResultsText` | string | `"No results"` | Text shown when the filter matches zero items. |
| `theme` | object | - | Antd design token overrides for the cards. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design card tokens](https://ant.design/components/card#design-token). |
| `theme.bodyPadding` | number | `24` | Padding of each card body. |
| `theme.bodyPaddingSM` | number | `12` | Padding of each card body for small cards. |
| `theme.borderRadiusLG` | number | `8` | Border radius of each card. |
| `theme.colorBorderSecondary` | string | - | Border color of each card. |
| `theme.colorBgContainer` | string | - | Background color of each card body. |
| `theme.colorText` | string | - | Text color inside each card. |
| `theme.boxShadowTertiary` | string | - | Shadow applied to each card on hover when hoverable is true. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onChange` | `{ value: any, index: integer, item: any }` | Triggered when the selection changes (only fires when `selectable` is true). |
| `onClick` | `{ index: integer, item: any }` | Triggered when a card is clicked. |
| `onSearch` | `{ value: string, resultCount: integer }` | Triggered when the debounced search query changes (only fires when the `search` property is set). |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The list container. |
| `/card` | Each Card element. |
| `/body` | Each Card body. |
| `/selected` | The selected card. |
| `/search` | The search bar wrapper above the list. |
| `/noResults` | The "no results" placeholder shown when the search filter matches zero items. |
| `/noData` | The "no data" placeholder shown when the data array is empty. |

No slots defined.
