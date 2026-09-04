# Template

Render a Nunjucks template into HTML, with CSS scoped to the block and slots that hold real Lowdefy blocks. Use Template instead of building HTML strings in `_js` for a custom card, table row or detail panel.

**Escaping.** Every `{{ value }}` is HTML-escaped, so values from state, requests or user input can be interpolated without an escape helper. The `| safe` filter turns escaping off for one value (`{{ markup | safe }}`) — only use it on markup the app itself produced, never on caller-supplied or database strings. The rendered result is still passed through DOMPurify, which removes `<script>`, inline event handlers and `<style>`.

**Context.** `properties.context` holds the values the template can read. An object is spread into the template scope (`context: { title: ... }` is read as `{{ title }}`); a primitive is available as `{{ value }}`. Any operator can build the context, and a `_js` module is the natural place to shape rows for a loop. All of Nunjucks is available: `{% if %}`, `{% for %}`, `{% set %}`, filters such as `default`, `join` and `upper`, and Lowdefy's `date`, `unique` and `urlQuery` filters.

**Scoped CSS.** `properties.css` is CSS *text* applied to this block only. It is rendered nested under the block wrapper selector (`#bl-<blockId> { ... }`), so a bare declaration styles the block wrapper, `.row { ... }` becomes `#bl-<blockId> .row` and `@media` blocks nest unchanged, with no CSS parsing or rewriting. This is where the `<style>` tag that the Html block strips belongs. The block-level `style:` config key is unrelated and stays an object of CSS properties per css key (`style: { .element: { padding: 8 } }`).

**Slots.** `{% slot "footer" %}` (a quoted name, no body, no `endslot`) marks where the blocks configured under `slots.footer.blocks` render, so a Button, an input or any other block can sit inside the templated markup and fire events as usual. Slot names are declared by the template, so any name works. A `{% slot %}` with no matching `slots:` entry renders an empty `div`, and a `slots:` entry with no matching tag renders nothing — neither is an error, because the template may be built by an operator.

**Tailwind.** Class names written inside `properties.template` are scanned by the Tailwind build like any other string in block properties. Classes that only exist inside a referenced `_js` module are not scanned — write them in the template or a string property.

> Templates compile in the browser when the block renders, not at build, because `properties.template` can be produced by operators (`_if`, `_ref`, `_js`, a `Dynamic` page). Each distinct template source compiles once per session and is cached. Template inheritance and `{% include %}` are not available — the source is a config string, there is no template loader — and template markup cannot wire event handlers; interaction belongs in slotted blocks.

```yaml
- id: basic_plain
  type: Template
  properties:
    context:
      name: Lowdefy
    template: <p>Hello <strong>{{ name }}</strong> from a Template block.</p>
- id: basic_primitive_context
  type: Template
  properties:
    context: 42
    template: "<p>A primitive context is available as <code>value</code>: {{ value
      }}</p>"
- id: basic_conditional
  type: Template
  properties:
    context:
      status: active
    template: >
      {% if status == "active" %}<p>Status is <strong>active</strong>.</p>{%
      else %}<p>Inactive.</p>{% endif %}
```

```yaml
- id: escaping_default
  type: Template
  properties:
    context:
      untrusted: <img src=x onerror=alert(1)><b>bold?</b>
    template: "<p>Escaped by default: {{ untrusted }}</p>"
- id: escaping_safe
  type: Template
  properties:
    context:
      markup: Trusted <b>bold</b> and <em>italic</em> markup
    template: "<p>With <code>| safe</code>: {{ markup | safe }}</p>"
```

```yaml
- id: loop_rows
  type: Template
  properties:
    context:
      rows:
        - label: Name
          value: Ada Lovelace
        - label: Born
          value: 1815
        - label: Field
          value: Mathematics
    css: >
      .row { display: flex; gap: 8px; padding: 4px 0; border-bottom: 1px solid
      var(--ant-color-border); }

      .row .label { color: var(--ant-color-text-secondary); min-width: 60px; }
    template: >
      {% for row in rows %}

      <div class="row"><span class="label">{{ row.label }}</span><span>{{
      row.value }}</span></div>

      {% endfor %}
- id: loop_list
  type: Template
  properties:
    context:
      items:
        - alpha
        - beta
        - gamma
    template: >
      <ol>{% for item in items %}<li>{{ loop.index }}. {{ item }}</li>{% endfor
      %}</ol>
```

```yaml
- id: scoped_style_red
  type: Template
  properties:
    css: >
      color: var(--ant-color-error);

      .tag { background: var(--ant-color-error-bg); padding: 2px 6px;
      border-radius: 4px; }
    template: <p>This block has a red <span class="tag">tag</span> style.</p>
- id: scoped_style_sibling
  type: Template
  properties:
    template: <p>This sibling block shares the <span class="tag">tag</span> class
      but is not styled by the block above.</p>
```

```yaml
- id: tailwind_card
  type: Template
  properties:
    context:
      title: Tailwind in a template
    template: >
      <div class="rounded-lg border border-gray-300 p-4 shadow-sm">
        <h3 class="text-lg font-semibold">{{ title }}</h3>
        <p class="text-sm text-gray-500">Classes written in the template are scanned by Tailwind at build.</p>
      </div>
```

```yaml
- id: slot_card
  type: Template
  properties:
    context:
      title: Answer card
      summary: A templated card with a real Button in its footer slot.
    css: >
      .card { border: 1px solid var(--ant-color-border); border-radius: 8px;
      padding: 16px; }

      .footer { margin-top: 12px; display: flex; justify-content: flex-end; }
    template: |
      <div class="card">
        <h3>{{ title }}</h3>
        <p>{{ summary }}</p>
        <div class="footer">{% slot "footer" %}</div>
      </div>
  slots:
    footer:
      blocks:
        - id: slot_card_approve
          type: Button
          properties:
            title: Approve
          events:
            onClick:
              - id: set_approved
                type: SetState
                params:
                  slot_card_approved: true
- id: slot_card_result
  type: Template
  properties:
    context:
      approved:
        _state: slot_card_approved
    template: |
      <p>Approved: <strong>{{ approved | default(false, true) }}</strong></p>
```

```yaml
- id: slot_card
  type: Template
  properties:
    context:
      title: Answer card
      summary: A templated card with a real Button in its footer slot.
    css: >
      .card { border: 1px solid var(--ant-color-border); border-radius: 8px;
      padding: 16px; }

      .footer { margin-top: 12px; display: flex; justify-content: flex-end; }
    template: |
      <div class="card">
        <h3>{{ title }}</h3>
        <p>{{ summary }}</p>
        <div class="footer">{% slot "footer" %}</div>
      </div>
  slots:
    footer:
      blocks:
        - id: slot_card_approve
          type: Button
          properties:
            title: Approve
          events:
            onClick:
              - id: set_approved
                type: SetState
                params:
                  slot_card_approved: true
- id: slot_card_result
  type: Template
  properties:
    context:
      approved:
        _state: slot_card_approved
    template: |
      <p>Approved: <strong>{{ approved | default(false, true) }}</strong></p>
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `template` | string | - | Nunjucks template source. {{ value }} is escaped, {{ value \| safe }} is not, and {% slot "name" %} places the blocks configured under slots.name. |
| `context` | - | - | Values available to the template. Objects are spread into the template scope; a primitive is available as "value". |
| `css` | string | - | CSS text applied to this block only. Rules are nested under the block wrapper selector, so ".row { ... }" styles only .row elements inside this block. |

No events defined.

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Template element. |

Slot keys are user-defined in your config and resolved at build time — not generated at runtime. The block typically pairs slots with an array property (`tabs`, `panels`, `slides`) listed in the Properties table; see the examples above for the expected shape.
