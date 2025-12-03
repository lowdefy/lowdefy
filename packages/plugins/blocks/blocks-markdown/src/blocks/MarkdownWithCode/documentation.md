<TITLE>
MarkdownWithCode
</TITLE>

<DESCRIPTION>

Render markdown content with code highlighting support. Currently, the following languages are supported:

- HTML: `html`
- Java: `java`
- Javascript: `javascript`, `js`, `jsx`
- JSON: `json`
- Markdown: `markdown`
- Nunjucks: `nunjucks`
- Python: `python`, `py`,
- Typescript: `typescript`, `ts`,
- XML: `xml`
- YAML: `yaml`

> For more details on markdown syntax see: [Markdown cheat sheet](https://guides.github.com/features/mastering-markdown/).

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "content": {
        "type": "string",
        "description": "Content in markdown format.",
        "docs": {
          "displayType": "text-area"
        }
      },
      "skipHtml": {
        "type": "boolean",
        "default": false,
        "description": "By default, HTML in markdown is escaped. When true all HTML code in the markdown will not be rendered."
      },
      "style": {
        "type": "object",
        "description": "Style to apply to Markdown div.",
        "docs": {
          "displayType": "yaml"
        }
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

##### Basic JavaScript code highlighting:

````yaml
id: js_example
type: MarkdownWithCode
properties:
  content: |
    ## JavaScript Array Methods
    Here's how to filter an array in JavaScript:
    ```javascript
    const numbers = [1, 2, 3, 4, 5];
    const evens = numbers.filter(n => n % 2 === 0);
    console.log(evens); // [2, 4]
    ```
````

##### YAML configuration documentation:

````yaml
id: yaml_config_example
type: MarkdownWithCode
properties:
  content: |
    ### Lowdefy Page Configuration
    Define a simple page with a text input:
    ```yaml
    id: my_page
    type: PageHeaderMenu
    blocks:
      - id: name_input
        type: TextInput
        properties:
          title: Enter your name
          placeholder: John Doe
    ```
````

##### Python code with explanation:

````yaml
id: python_example
type: MarkdownWithCode
properties:
  content: |
    ### Python Data Processing
    Use list comprehensions for concise data transformation:
    ```python
    # Square all even numbers
    data = [1, 2, 3, 4, 5, 6]
    result = [x**2 for x in data if x % 2 == 0]
    print(result)  # [4, 16, 36]
    ```
    > **Tip:** List comprehensions are more Pythonic than traditional loops.
````

##### Dynamic content using Nunjucks templating:

````yaml
id: dynamic_docs
type: MarkdownWithCode
properties:
  content:
    _nunjucks:
      template: |
        ## API Response
        The following data was retrieved from the server:
        ```json
        {{ user_data | safe }}
        ```
        **Status:** {{ status }}
      on:
        user_data:
          _json.stringify:
            on:
              _state: api_response
        status:
          _state: api_status
````

##### Custom styling with multiple code blocks:

````yaml
id: styled_markdown
type: MarkdownWithCode
style:
  background: '#f5f5f5'
  padding: 16
  borderRadius: 8
properties:
  content: |
    ### Multi-Language Example

    **TypeScript:**
    ```typescript
    interface User {
      id: number;
      name: string;
      email: string;
    }

    const getUser = async (id: number): Promise<User> => {
      return await fetch(`/api/users/${id}`).then(r => r.json());
    };
    ```

    **Equivalent JSON schema:**
    ```json
    {
      "type": "object",
      "properties": {
        "id": { "type": "number" },
        "name": { "type": "string" },
        "email": { "type": "string" }
      }
    }
    ```
````

##### HTML code display with skipHtml enabled:

````yaml
id: html_code_example
type: MarkdownWithCode
properties:
  skipHtml: true
  content: |
    ### HTML Template
    Here's a sample HTML structure:
    ```html
    <div class="card">
      <h2>Welcome</h2>
      <p>This is a <strong>sample</strong> card.</p>
      <button onclick="handleClick()">Click Me</button>
    </div>
    ```
    Note: With `skipHtml: true`, any raw HTML in the markdown will not be rendered.
````

##### Documentation page with Nunjucks and code snippets:

````yaml
id: config_docs
type: MarkdownWithCode
properties:
  content:
    _nunjucks:
      template: |
        ## Connection Configuration
        Configure your MongoDB connection with change logging:
        ```yaml
        {{ config | indent(8) }}
        ```
        The schema for logged changes is:
        ```json
        {{ schema | safe | indent(8) }}
        ```
      on:
        config:
          _yaml.stringify:
            on:
              _state: connection_config
        schema:
          _json.stringify:
            on:
              _state: log_schema
````

</EXAMPLES>
