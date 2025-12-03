<TITLE>
DangerousMarkdown
</TITLE>

<DESCRIPTION>

Render markdown content which can include HTML elements. If the markdown content does not need to render HTML, use the [Markdown](/Markdown) or [MarkdownWithCode](/MarkdownWithCode) blocks instead. Specify what HTML element to allow or remove by changing the default modifying the [DOMPurify's options](https://github.com/cure53/DOMPurify#can-i-configure-dompurify).

> The DangerousMarkdown block sanitizes the markdown content using [DOMPurify's](https://github.com/cure53/DOMPurify) before converting the markdown to HTML. DangerousMarkdown provides the ability to customize the sanitization options. This comes with some security considerations, please consider [DOMPurify's Security Goals and Threat Model](https://github.com/cure53/DOMPurify/wiki/Security-Goals-&-Threat-Model) for more details regarding the security impact of using the DangerousMarkdown block.

> In short, it is strongly advised to never render any user input DangerousMarkdown content, only render hardcoded or trusted markdown and HTML content.

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
      "DOMPurifyOptions": {
        "type": "object",
        "description": "Customize DOMPurify options. Options are only applied when the block is mounted, thus any parsed settings is only applied at first render.",
        "docs": {
          "displayType": "yaml"
        }
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

### Embedding a YouTube video with iframe

Use `DOMPurifyOptions.ADD_TAGS` to allow iframe elements and `ADD_ATTR` to preserve iframe-specific attributes:

```yaml
id: youtube_video
type: DangerousMarkdown
properties:
  DOMPurifyOptions:
    ADD_TAGS:
      - iframe
    ADD_ATTR:
      - allowfullscreen
      - allow
      - frameborder
  content: |
    ## Watch Our Tutorial

    <iframe
      width="560"
      height="315"
      src="https://www.youtube.com/embed/pkCJpDleMtI"
      title="YouTube video player"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen>
    </iframe>
```

### Styled HTML with custom fonts and colors

Combine markdown with inline HTML styles for rich content presentation:

```yaml
id: styled_announcement
type: DangerousMarkdown
style:
  padding: 20px
  background: '#f8f9fa'
  borderRadius: 8px
properties:
  content: |
    # Welcome to <span style="color: #1890ff;">Our Platform</span>

    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; color: white;">
      <h2 style="margin: 0; color: white;">🎉 New Feature Alert!</h2>
      <p style="margin-top: 10px;">We've just launched <strong>advanced analytics</strong> for all users.</p>
    </div>

    ### Key Benefits
    - Real-time dashboard updates
    - Custom report generation
    - Export to multiple formats
```

### Downloadable file link with target attribute

Use `ADD_ATTR` to allow the `target`, `download`, and `rel` attributes on anchor tags:

```yaml
id: download_resources
type: DangerousMarkdown
properties:
  DOMPurifyOptions:
    ADD_ATTR:
      - target
      - download
      - rel
  content: |
    ## Resources

    Download the following files to get started:

    - <a href="/docs/user-guide.pdf" download>User Guide (PDF)</a>
    - <a href="/docs/quick-start.pdf" download>Quick Start Guide</a>
    - <a href="https://example.com/docs" target="_blank" rel="noopener noreferrer">View Online Documentation</a>
```

### Interactive alert box with HTML structure

Create visually appealing alert boxes using HTML within markdown:

```yaml
id: warning_notice
type: DangerousMarkdown
properties:
  content: |
    ## Important Information

    <div style="display: flex; align-items: flex-start; background-color: #fffbe6; border: 1px solid #ffe58f; border-radius: 4px; padding: 16px; margin: 16px 0;">
      <span style="font-size: 24px; margin-right: 12px;">⚠️</span>
      <div>
        <strong style="color: #d48806;">Scheduled Maintenance</strong>
        <p style="margin: 8px 0 0 0; color: #614700;">
          The system will be unavailable on <strong>Saturday, 10:00 PM - 2:00 AM</strong> for scheduled maintenance.
        </p>
      </div>
    </div>

    Please save your work before the maintenance window begins.
```

### Rich content with tables and styled sections

Combine markdown tables with styled HTML for enhanced data presentation:

```yaml
id: pricing_table
type: DangerousMarkdown
style:
  maxWidth: 800px
properties:
  content: |
    # Pricing Plans

    <div style="text-align: center; margin-bottom: 20px;">
      <span style="background: #52c41a; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">
        Save 20% with annual billing
      </span>
    </div>

    | Plan | Monthly | Annual | Features |
    |:-----|--------:|-------:|:---------|
    | **Starter** | $9 | $86 | 5 users, 10GB storage |
    | **Professional** | $29 | $278 | 25 users, 100GB storage |
    | **Enterprise** | $99 | $950 | Unlimited users, 1TB storage |

    <p style="text-align: center; color: #8c8c8c; font-size: 12px; margin-top: 16px;">
      All plans include 24/7 support and free updates.
    </p>
```

### Embedding external widgets with multiple tags

Allow multiple HTML tags for embedding third-party widgets:

```yaml
id: embedded_widget
type: DangerousMarkdown
properties:
  DOMPurifyOptions:
    ADD_TAGS:
      - iframe
      - script
      - noscript
    ADD_ATTR:
      - src
      - data-id
      - async
      - defer
      - frameborder
      - scrolling
  content: |
    ## Live Chat Support

    Need help? Chat with our support team:

    <iframe
      src="https://example.com/chat-widget"
      width="100%"
      height="400"
      frameborder="0"
      scrolling="no">
    </iframe>

    <noscript>
      <p>Please enable JavaScript to use the chat widget.</p>
    </noscript>
```

### Info cards with custom HTML layout

Create information cards using HTML flexbox within markdown:

```yaml
id: feature_cards
type: DangerousMarkdown
properties:
  content: |
    # Our Features

    <div style="display: flex; gap: 16px; flex-wrap: wrap; margin: 20px 0;">
      <div style="flex: 1; min-width: 200px; background: #e6f7ff; border-left: 4px solid #1890ff; padding: 16px; border-radius: 4px;">
        <strong style="color: #1890ff;">🚀 Fast Performance</strong>
        <p style="margin: 8px 0 0 0; font-size: 14px;">Lightning-fast load times with optimized caching.</p>
      </div>
      <div style="flex: 1; min-width: 200px; background: #f6ffed; border-left: 4px solid #52c41a; padding: 16px; border-radius: 4px;">
        <strong style="color: #52c41a;">🔒 Secure</strong>
        <p style="margin: 8px 0 0 0; font-size: 14px;">Enterprise-grade security with encryption.</p>
      </div>
      <div style="flex: 1; min-width: 200px; background: #fff7e6; border-left: 4px solid #fa8c16; padding: 16px; border-radius: 4px;">
        <strong style="color: #fa8c16;">📊 Analytics</strong>
        <p style="margin: 8px 0 0 0; font-size: 14px;">Comprehensive insights and reporting tools.</p>
      </div>
    </div>

    Learn more about each feature in our documentation.
```

</EXAMPLES>
