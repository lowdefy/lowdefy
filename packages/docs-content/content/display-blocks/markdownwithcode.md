# MarkdownWithCode

Render Markdown with syntax-highlighted code blocks.

Use the `MarkdownWithCode` block to render code with syntax highlighting.

Set properties with `properties.content` and use backticks for `inline code`.

Install with `npm install lowdefy` or `pnpm add lowdefy`.

The config file is called `lowdefy.yaml` and lives in your project root.

Run `npx lowdefy@4 dev` to start the dev server on `http://localhost:3000`.

```yaml
- id: inline_basic
  type: MarkdownWithCode
  properties:
    content: >
      Use the `MarkdownWithCode` block to render code with syntax highlighting.


      Set properties with `properties.content` and use backticks for `inline
      code`.
- id: inline_in_context
  type: MarkdownWithCode
  properties:
    content: >
      Install with `npm install lowdefy` or `pnpm add lowdefy`.


      The config file is called `lowdefy.yaml` and lives in your project root.


      Run `npx lowdefy@4 dev` to start the dev server on
      `http://localhost:3000`.
```

```yaml
lowdefy: 4.0.0

pages:
  - id: home
    type: PageHeaderMenu
    properties:
      title: My Application
    blocks:
      - id: welcome_title
        type: Title
        properties:
          content: Welcome
          level: 2
      - id: user_form
        type: Card
        properties:
          title: User Information
        blocks:
          - id: name_input
            type: TextInput
            properties:
              label:
                title: Full Name
          - id: email_input
            type: TextInput
            properties:
              label:
                title: Email Address
          - id: submit_button
            type: Button
            properties:
              title: Submit
              type: primary
            events:
              onClick:
                - id: validate
                  type: Validate
```

````yaml
- id: code_yaml
  type: MarkdownWithCode
  properties:
    content: |
      ```yaml
      lowdefy: 4.0.0

      pages:
        - id: home
          type: PageHeaderMenu
          properties:
            title: My Application
          blocks:
            - id: welcome_title
              type: Title
              properties:
                content: Welcome
                level: 2
            - id: user_form
              type: Card
              properties:
                title: User Information
              blocks:
                - id: name_input
                  type: TextInput
                  properties:
                    label:
                      title: Full Name
                - id: email_input
                  type: TextInput
                  properties:
                    label:
                      title: Email Address
                - id: submit_button
                  type: Button
                  properties:
                    title: Submit
                    type: primary
                  events:
                    onClick:
                      - id: validate
                        type: Validate
      ```
````

```javascript
function buildConnections({ components, context }) {
  const connections = components.connections ?? [];

  connections.forEach((connection) => {
    if (!connection.id) {
      throw new Error('Connection id is missing.');
    }
    if (!connection.type) {
      throw new Error(`Connection "${connection.id}" does not have a type.`);
    }
  });

  return components;
}

export default buildConnections;
```

````yaml
- id: code_javascript
  type: MarkdownWithCode
  properties:
    content: >
      ```javascript

      function buildConnections({ components, context }) {
        const connections = components.connections ?? [];

        connections.forEach((connection) => {
          if (!connection.id) {
            throw new Error('Connection id is missing.');
          }
          if (!connection.type) {
            throw new Error(`Connection "${connection.id}" does not have a type.`);
          }
        });

        return components;
      }


      export default buildConnections;

      ```
````

```json
{
  "name": "@lowdefy/blocks-antd",
  "version": "4.0.0",
  "description": "Ant Design blocks for Lowdefy",
  "main": "dist/index.js",
  "types": [
    {
      "typeName": "Button",
      "category": "display"
    },
    {
      "typeName": "TextInput",
      "category": "input"
    },
    {
      "typeName": "Card",
      "category": "container"
    }
  ],
  "dependencies": {
    "antd": "^6.0.0",
    "react": "^19.0.0"
  }
}
```

````yaml
- id: code_json
  type: MarkdownWithCode
  properties:
    content: |
      ```json
      {
        "name": "@lowdefy/blocks-antd",
        "version": "4.0.0",
        "description": "Ant Design blocks for Lowdefy",
        "main": "dist/index.js",
        "types": [
          {
            "typeName": "Button",
            "category": "display"
          },
          {
            "typeName": "TextInput",
            "category": "input"
          },
          {
            "typeName": "Card",
            "category": "container"
          }
        ],
        "dependencies": {
          "antd": "^6.0.0",
          "react": "^19.0.0"
        }
      }
      ```
````

```python
import json
from pathlib import Path


class ConfigLoader:
    """Load and validate Lowdefy configuration files."""

    def __init__(self, config_path: str):
        self.config_path = Path(config_path)
        self.config = {}

    def load(self) -> dict:
        with open(self.config_path) as f:
            self.config = json.load(f)
        return self.config

    def validate(self) -> bool:
        required_keys = ["lowdefy", "pages"]
        return all(key in self.config for key in required_keys)


if __name__ == "__main__":
    loader = ConfigLoader("lowdefy.json")
    config = loader.load()
    print(f"Valid: {loader.validate()}")
```

````yaml
- id: code_python
  type: MarkdownWithCode
  properties:
    content: |
      ```python
      import json
      from pathlib import Path


      class ConfigLoader:
          """Load and validate Lowdefy configuration files."""

          def __init__(self, config_path: str):
              self.config_path = Path(config_path)
              self.config = {}

          def load(self) -> dict:
              with open(self.config_path) as f:
                  self.config = json.load(f)
              return self.config

          def validate(self) -> bool:
              required_keys = ["lowdefy", "pages"]
              return all(key in self.config for key in required_keys)


      if __name__ == "__main__":
          loader = ConfigLoader("lowdefy.json")
          config = loader.load()
          print(f"Valid: {loader.validate()}")
      ```
````

```typescript
interface BlockMeta {
  category: 'display' | 'input' | 'container' | 'list';
  icons: string[];
  styles: string[];
}

interface BlockComponent<P = Record<string, unknown>> {
  blockId: string;
  properties: P;
  methods: {
    setState: (state: Record<string, unknown>) => void;
    triggerEvent: (event: { name: string }) => Promise<void>;
  };
}

function createBlock<P>(
  render: (props: BlockComponent<P>) => JSX.Element,
  meta: BlockMeta
): typeof render & { meta: BlockMeta } {
  const block = render as typeof render & { meta: BlockMeta };
  block.meta = meta;
  return block;
}
```

````yaml
- id: code_typescript
  type: MarkdownWithCode
  properties:
    content: |
      ```typescript
      interface BlockMeta {
        category: 'display' | 'input' | 'container' | 'list';
        icons: string[];
        styles: string[];
      }

      interface BlockComponent<P = Record<string, unknown>> {
        blockId: string;
        properties: P;
        methods: {
          setState: (state: Record<string, unknown>) => void;
          triggerEvent: (event: { name: string }) => Promise<void>;
        };
      }

      function createBlock<P>(
        render: (props: BlockComponent<P>) => JSX.Element,
        meta: BlockMeta
      ): typeof render & { meta: BlockMeta } {
        const block = render as typeof render & { meta: BlockMeta };
        block.meta = meta;
        return block;
      }
      ```
````

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lowdefy App</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <div id="root">
      <header class="app-header">
        <h1>My Application</h1>
        <nav>
          <a href="/dashboard">Dashboard</a>
          <a href="/settings">Settings</a>
        </nav>
      </header>
      <main class="content"></main>
    </div>
    <script src="/bundle.js"></script>
  </body>
</html>
```

````yaml
- id: code_html
  type: MarkdownWithCode
  properties:
    content: >
      ```html

      <!DOCTYPE html>

      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Lowdefy App</title>
          <link rel="stylesheet" href="/styles.css" />
        </head>
        <body>
          <div id="root">
            <header class="app-header">
              <h1>My Application</h1>
              <nav>
                <a href="/dashboard">Dashboard</a>
                <a href="/settings">Settings</a>
              </nav>
            </header>
            <main class="content"></main>
          </div>
          <script src="/bundle.js"></script>
        </body>
      </html>

      ```
````

```nunjucks
{# Lowdefy docs page template #}
_ref:
  path: templates/general.yaml.njk
  vars:
    pageId: {{ pageId }}
    pageTitle: {{ pageTitle }}
    section: {{ section }}
    fullWidth: true
    content:
      - id: intro
        type: Markdown
        properties:
          content: |
            {{ description }}
      {% for example in examples %}
      - id: example_{{ loop.index }}
        type: {{ example.block_type }}
        properties:
          {{ example.properties | dump | safe }}
      {% endfor %}
```

````yaml
- id: code_nunjucks
  type: MarkdownWithCode
  properties:
    content: |
      ```nunjucks
      {# Lowdefy docs page template #}
      _ref:
        path: templates/general.yaml.njk
        vars:
          pageId: {{ pageId }}
          pageTitle: {{ pageTitle }}
          section: {{ section }}
          fullWidth: true
          content:
            - id: intro
              type: Markdown
              properties:
                content: |
                  {{ description }}
            {% for example in examples %}
            - id: example_{{ loop.index }}
              type: {{ example.block_type }}
              properties:
                {{ example.properties | dump | safe }}
            {% endfor %}
      ```
````

## Building a Form with Lowdefy

Follow these steps to create a simple contact form.

### 1. Create the Page

Start by defining a page in your `lowdefy.yaml`:

```yaml
pages:
  - id: contact
    type: PageHeaderMenu
    properties:
      title: Contact Us
```

### 2. Add Form Fields

Add input blocks inside the page:

```yaml
    blocks:
      - id: name
        type: TextInput
        properties:
          label:
            title: Your Name
      - id: message
        type: TextArea
        properties:
          label:
            title: Message
```

### 3. Handle Submission

Use an action to process the form data:

```javascript
// The _state operator accesses form values
// _state.name returns the value of the "name" TextInput
// _state.message returns the value of the "message" TextArea
```

> **Tip:** Use the `Validate` action before `Request` to ensure all required fields are filled in.

For the complete guide, see the [Lowdefy documentation](https://docs.lowdefy.com).

````yaml
- id: mixed_tutorial
  type: MarkdownWithCode
  properties:
    content: >
      ## Building a Form with Lowdefy


      Follow these steps to create a simple contact form.


      ### 1. Create the Page


      Start by defining a page in your `lowdefy.yaml`:


      ```yaml

      pages:
        - id: contact
          type: PageHeaderMenu
          properties:
            title: Contact Us
      ```


      ### 2. Add Form Fields


      Add input blocks inside the page:


      ```yaml
          blocks:
            - id: name
              type: TextInput
              properties:
                label:
                  title: Your Name
            - id: message
              type: TextArea
              properties:
                label:
                  title: Message
      ```


      ### 3. Handle Submission


      Use an action to process the form data:


      ```javascript

      // The _state operator accesses form values

      // _state.name returns the value of the "name" TextInput

      // _state.message returns the value of the "message" TextArea

      ```


      > **Tip:** Use the `Validate` action before `Request` to ensure all
      required fields are filled in.


      For the complete guide, see the [Lowdefy
      documentation](https://docs.lowdefy.com).
````

### Configuration vs Code

The same logic expressed in YAML config and JavaScript:

**Lowdefy YAML:**
```yaml
- id: greeting
  type: Paragraph
  properties:
    content:
      _if:
        test:
          _state: logged_in
        then:
          _string.concat:
            - 'Welcome back, '
            - _state: username
            - '!'
        else: Please log in to continue.
```

**Equivalent JavaScript:**
```javascript
function getGreeting(state) {
  if (state.logged_in) {
    return `Welcome back, ${state.username}!`;
  }
  return 'Please log in to continue.';
}
```

````yaml
- id: multi_language
  type: MarkdownWithCode
  properties:
    content: |
      ### Configuration vs Code

      The same logic expressed in YAML config and JavaScript:

      **Lowdefy YAML:**
      ```yaml
      - id: greeting
        type: Paragraph
        properties:
          content:
            _if:
              test:
                _state: logged_in
              then:
                _string.concat:
                  - 'Welcome back, '
                  - _state: username
                  - '!'
              else: Please log in to continue.
      ```

      **Equivalent JavaScript:**
      ```javascript
      function getGreeting(state) {
        if (state.logged_in) {
          return `Welcome back, ${state.username}!`;
        }
        return 'Please log in to continue.';
      }
      ```
````

**skipHtml: false (default)**

HTML tags like `<b>` are escaped and shown as text in the output. This is the default, safe behavior.

**skipHtml: true**

With skipHtml enabled, any HTML tags like <b>bold</b> are completely removed from the output rather than shown as escaped text.

```yaml
- id: skip_html_false
  type: MarkdownWithCode
  properties:
    content: >
      **skipHtml: false (default)**


      HTML tags like `<b>` are escaped and shown as text in the output. This is
      the default, safe behavior.
- id: skip_html_true
  type: MarkdownWithCode
  properties:
    skipHtml: true
    content: >
      **skipHtml: true**


      With skipHtml enabled, any HTML tags like <b>bold</b> are completely
      removed from the output rather than shown as escaped text.
```

### Styled Code Container

The `element` style key wraps the entire block:

```yaml
style:
  .element:
    backgroundColor: var(--ant-color-success-bg)
    padding: 16
    borderRadius: 8
```

````yaml
- id: style_element
  type: MarkdownWithCode
  style:
    .element:
      backgroundColor: var(--ant-color-success-bg)
      padding: 16
      borderRadius: 8
      border: 1px solid var(--ant-color-success-border)
  properties:
    content: |
      ### Styled Code Container

      The `element` style key wraps the entire block:

      ```yaml
      style:
        .element:
          backgroundColor: var(--ant-color-success-bg)
          padding: 16
          borderRadius: 8
      ```
````

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `content` | string | - | Content in markdown format. |
| `skipHtml` | boolean | `false` | By default, HTML in markdown is escaped. When true all HTML code in the markdown will not be rendered. |

No events defined.

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The MarkdownWithCode element. |

No slots defined.
