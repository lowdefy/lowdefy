# HTML attributes

Every block that renders HTML understands a small set of `data-*` attributes: `Html`, `ClickableHtml`, `DangerousHtml`, HTML properties such as Tooltip titles, Card titles and Alert messages, ag-grid cell HTML, and the `EventLog` block. They give HTML the icons, tooltips, links and status tags that apps otherwise build by hand with inline styles, and they look and behave the same in every app.

The attributes work on HTML from anywhere: page config, `_nunjucks` templates, request results and messages that API endpoints build on the server.

| Attribute | On | Effect |
|---|---|---|
| `data-icon="edit"` | any element | Renders the icon inside the element. |
| `data-tooltip="Text"` | any element | Shows a tooltip on hover and keyboard focus. |
| `data-popover="id"` | any element | Click, Enter or Space toggles a popover showing the element with `data-popover-content="id"`. |
| `data-event="onName"` | any element | `ClickableHtml` only: fires the block event `onName`. |
| `data-page-id="page"` | `<a>` | A link to a page of the app, opened without reloading the app. |
| `data-url-query="key=value"` | `<a data-page-id>` | The link's query string. |
| `data-link` | `<a href="/path">` | Opens an app path without reloading the app. |
| `data-new-tab` | `<a href>` | Opens the link in a new tab. |
| `data-tag="success"` | any element | A tinted status tag. |
| `data-status="success"` | any element | A status dot before the text. |

Attribute values are plain text, names, numbers or colours. They are never read as HTML, templates or code, and HTML is sanitised before the attributes are applied.

## Icons

`data-icon` renders an icon inside the element. Use a built-in semantic name such as `edit`, `delete`, `warning` or `external-link`, a name from `theme.icons.aliases`, or any React Icons name. The icon takes the element's font size and text colour. See [Theming](/theming) for the icon names and aliases.

```html
<i data-icon="success" style="color: var(--ant-color-success)"></i> Saved
```

An icon on its own is decorative to screen readers unless the element has a `data-tooltip` or an `aria-label`. An unknown name renders nothing and logs a console warning.

## Tooltips and popovers

`data-tooltip` shows a themed tooltip on hover and keyboard focus. A `title` on the same element is removed so only one tooltip shows.

`data-popover="id"` toggles a popover on click, Enter or Space. Its content is the element with `data-popover-content="id"` in the same HTML; give that element the `hidden` attribute. Icons, tooltips, links and `data-event` all work inside popover content.

```yaml
- id: row_actions
  type: ClickableHtml
  properties:
    html: >
      <i data-icon="edit" data-event="onEdit" data-id="42" data-tooltip="Edit"></i>
      <span data-popover="more">More <i data-icon="chevron-down"></i></span>
      <div data-popover-content="more" hidden>
        <p data-event="onArchive" data-id="42"><i data-icon="folder"></i> Archive</p>
      </div>
  events:
    onEdit:
      - id: edit
        type: SetState
        params:
          editing: { _event: id }
    onArchive:
      - id: archive
        type: SetState
        params:
          archiving: { _event: id }
```

Popovers close on a click outside, on Escape, on a second click on the trigger, and after a `data-event` inside them fires.

## Events

In `ClickableHtml`, an element with `data-event="onName"` fires the block event `onName` when clicked, and its default browser action is prevented. The event object holds the element's other `data-*` attributes with snake_case keys, so `data-event="onEdit" data-record-id="42"` gives `{ record_id: "42" }`. Targets that are not links or buttons become keyboard focusable, and Enter or Space clicks them. `Html` fires no events.

## Links

Use `data-page-id` for links to pages of your app, instead of writing the href:

```html
<a data-page-id="contact-details" data-url-query="_id={{ _id }}">{{ name }}</a>
```

Lowdefy sets the `href` (including the app's `basePath`), and a plain click opens the page without reloading the app, the same as a [`Link`](/Link) action with `pageId` and `urlQuery`. Middle-click, Ctrl or Cmd-click, "copy link" and hover preview work as for any link. `data-url-query` is a query string (`a=1&b=2`); its values reach the page's `_url_query` the same way the `Link` action's `urlQuery` does.

The build checks every `data-page-id` it can read in your config, including HTML built by API endpoints, and warns when a page does not exist, with a suggestion for a likely typo. Values built from templates, such as `data-page-id="{{ page }}"`, are not checked. Inside a module, build the page id with `_module.pageId` (for example in a `_string.concat`); the build checks the resolved id.

Use `data-page-id` to write a link. When you already have a whole URL, for example a notification's stored `link` field, `data-link` opens it without reloading the app. The path is relative to the app, like the `Link` action's `url`, so Lowdefy adds the `basePath`. The build does not check `data-link` paths.

```html
<a href="/tickets-view?_id=42" data-link>Ticket 42</a>
```

Only hrefs that start with a single `/` and have no `#` are handled; everything else stays a normal link. Plain `<a href="/…">` links without `data-link` keep reloading the page, because paths like `/api/…` or files in `public/` are not app pages.

`data-new-tab` opens any link in a new tab. HTML is sanitised, which removes `target` attributes, so write `data-new-tab` instead of `target="_blank"`:

```html
<a data-page-id="report" data-new-tab>Open report</a>
<a href="https://example.com/help" data-new-tab>Help</a>
```

`data-link="false"` and `data-new-tab="false"` turn the attribute off, so a template can write `data-new-tab="{{ new_tab }}"`.

In `ClickableHtml`, a link that also has `data-event` fires the event and does not navigate. In an ag-grid cell, the grid's `onRowClick` still fires when a link in the row is clicked, as it does for `link` cells.

## Status tags and dots

`data-tag` renders the element as a tinted tag, and `data-status` puts a coloured dot before its text. Both look the same as the ag-grid block's `tag` cells and follow the app theme and dark mode.

```html
<span data-tag="success">Approved</span>
<span data-tag="orange">On hold</span>
<span data-status="processing">Syncing</span>
<span data-tag>{{ category }}</span>
```

The value is one of:

- **A tone:** `success`, `processing`, `info`, `warning`, `error`, `default`, or an Ant Design preset colour: `red`, `volcano`, `orange`, `gold`, `yellow`, `lime`, `green`, `cyan`, `blue`, `geekblue`, `purple`, `magenta`. Tones use theme colours.
- **A CSS colour:** `#1677ff`, `rgb(22 119 255)`, or a theme variable such as `var(--ant-color-primary)`.
- **Anything else, or nothing:** the colour is picked from the value, or from the element's text when the attribute has no value, so the same text always gets the same colour. `data-tag="{{ category_id }}"` keeps a colour stable when the category is renamed.

The text is the label, so colour is never the only signal. Override the look with your own styles: the built-in styles have no specificity, so any class, Tailwind utility or inline style wins.

## Plugin blocks

A block plugin that renders HTML gets these attributes by rendering through `renderHtml` or `HtmlComponent` from `@lowdefy/block-utils`. A block that runs its own sanitiser and sets `innerHTML` directly does not.
