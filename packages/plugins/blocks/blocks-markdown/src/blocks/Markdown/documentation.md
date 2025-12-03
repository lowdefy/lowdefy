<TITLE>
Markdown
</TITLE>

<DESCRIPTION>

Render markdown text content. For markdown that renders html use DangerousMarkdown, for markdown wirth code blocks use MarkdownWithCode.

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

### Basic Markdown Content

Display simple markdown text with headings, paragraphs, and formatting.

```yaml
id: welcome_message
type: Markdown
properties:
  content: |
    # Welcome to Our App

    This is a **bold** statement and this is *italic*.

    Here's a simple paragraph with some `inline code` formatting.
```

### Markdown with Links and Lists

Render content with hyperlinks and bullet points.

```yaml
id: getting_started
type: Markdown
properties:
  content: |
    ## Getting Started

    Check out these resources:

    - [Lowdefy Documentation](https://docs.lowdefy.com)
    - [GitHub Repository](https://github.com/lowdefy/lowdefy)
    - [Community Discord](https://discord.gg/lowdefy)

    ### Steps to Begin

    1. Install the CLI
    2. Create your first app
    3. Deploy to production
```

### Dynamic Content with Operators

Use Lowdefy operators to render dynamic markdown content.

````yaml
id: dynamic_info
type: Markdown
properties:
  content:
    _string.concat:
      - |
        ## Request Results

        ```yaml
      - _yaml.stringify:
          - _request: fetch_data
      - |
        ```

        Data fetched at:
      - _date.now: {}
````

### Custom Styled Markdown

Apply custom CSS styles to the markdown container.

```yaml
id: styled_content
type: Markdown
style:
  padding: 24px
  backgroundColor: '#f5f5f5'
  borderRadius: 8px
  '.markdown-body':
    fontSize: 16px
    lineHeight: 1.8
properties:
  content: |
    ## Styled Section

    This markdown block has custom styling applied including:

    - Gray background
    - Rounded corners
    - Custom font size and line height

    > This is a blockquote that stands out nicely.
```

### Markdown with HTML Disabled

Use `skipHtml` to prevent any HTML from being rendered for security.

```yaml
id: safe_content
type: Markdown
properties:
  skipHtml: true
  content: |
    ## User Submitted Content

    This content may contain user input, so HTML is disabled.

    Any <script>alert('xss')</script> tags will not be rendered.

    Only **markdown formatting** will be displayed.
```

### Tables in Markdown

Render data tables using GitHub Flavored Markdown syntax.

```yaml
id: data_table
type: Markdown
properties:
  content: |
    ## Feature Comparison

    | Feature     | Basic Plan | Pro Plan | Enterprise |
    |-------------|:----------:|:--------:|:----------:|
    | Users       | 5          | 50       | Unlimited  |
    | Storage     | 10 GB      | 100 GB   | 1 TB       |
    | Support     | Email      | Priority | Dedicated  |
    | Price       | Free       | $49/mo   | Contact Us |

    Choose the plan that best fits your needs.
```

</EXAMPLES>
