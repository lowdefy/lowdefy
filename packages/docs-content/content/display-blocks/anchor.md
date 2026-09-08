# Anchor

Hyperlink anchor for navigation.

```yaml
- id: basic_url
  type: Anchor
  layout:
    flex: 0 0 auto
  properties:
    title: External URL
    url: https://lowdefy.com
- id: basic_href
  type: Anchor
  layout:
    flex: 0 0 auto
  properties:
    title: Internal href
    href: /introduction
- id: basic_no_title
  type: Anchor
  layout:
    flex: 0 0 auto
  properties:
    url: https://lowdefy.com
```

```yaml
- id: title_short
  type: Anchor
  layout:
    flex: 0 0 auto
  properties:
    title: Home
    href: /
- id: title_long
  type: Anchor
  layout:
    flex: 0 0 auto
  properties:
    title: Read the full documentation and learn more
    url: https://docs.lowdefy.com
- id: title_special
  type: Anchor
  layout:
    flex: 0 0 auto
  properties:
    title: Terms & Conditions
    url: https://lowdefy.com
```

```yaml
- id: icon_string
  type: Anchor
  layout:
    flex: 0 0 auto
  properties:
    title: Link with Icon
    url: https://lowdefy.com
    icon: AiOutlineLink
- id: icon_download
  type: Anchor
  layout:
    flex: 0 0 auto
  properties:
    title: Download
    url: https://lowdefy.com
    icon: AiOutlineDownload
- id: icon_external
  type: Anchor
  layout:
    flex: 0 0 auto
  properties:
    title: External Link
    url: https://lowdefy.com
    icon: AiOutlineExport
- id: icon_mail
  type: Anchor
  layout:
    flex: 0 0 auto
  properties:
    title: Send Email
    url: https://lowdefy.com
    icon: AiOutlineMail
- id: icon_github
  type: Anchor
  layout:
    flex: 0 0 auto
  properties:
    title: GitHub
    url: https://github.com/lowdefy/lowdefy
    icon: AiOutlineGithub
- id: icon_object
  type: Anchor
  layout:
    flex: 0 0 auto
  properties:
    title: Colored Icon
    url: https://lowdefy.com
    icon:
      name: AiOutlineHeart
      color: "#ff4d4f"
```

```yaml
- id: newtab_url
  type: Anchor
  layout:
    flex: 0 0 auto
  properties:
    title: Open in New Tab
    url: https://lowdefy.com
    newTab: true
- id: newtab_icon
  type: Anchor
  layout:
    flex: 0 0 auto
  properties:
    title: External Docs
    url: https://docs.lowdefy.com
    newTab: true
    icon: AiOutlineExport
```

```yaml
- id: disabled_plain
  type: Anchor
  layout:
    flex: 0 0 auto
  properties:
    title: Disabled Link
    url: https://lowdefy.com
    disabled: true
- id: disabled_icon
  type: Anchor
  layout:
    flex: 0 0 auto
  properties:
    title: Disabled with Icon
    url: https://lowdefy.com
    disabled: true
    icon: AiOutlineLock
- id: enabled_link
  type: Anchor
  layout:
    flex: 0 0 auto
  properties:
    title: Enabled Link
    url: https://lowdefy.com
    disabled: false
    icon: AiOutlineUnlock
```

```yaml
- id: aria_basic
  type: Anchor
  layout:
    flex: 0 0 auto
  properties:
    title: Accessible Link
    url: https://lowdefy.com
    ariaLabel: Navigate to the Lowdefy homepage
- id: aria_icon_only
  type: Anchor
  layout:
    flex: 0 0 auto
  properties:
    url: https://lowdefy.com
    icon: AiOutlineHome
    ariaLabel: Go to home page
```

```yaml
- id: rel_default
  type: Anchor
  layout:
    flex: 0 0 auto
  properties:
    title: Default rel (noopener noreferrer)
    url: https://lowdefy.com
    newTab: true
- id: rel_custom
  type: Anchor
  layout:
    flex: 0 0 auto
  properties:
    title: Custom rel
    url: https://lowdefy.com
    rel: nofollow
    newTab: true
```

```yaml
- id: nav_back
  type: Anchor
  layout:
    flex: 0 0 auto
  properties:
    title: Go Back
    back: true
    icon: AiOutlineArrowLeft
- id: nav_home
  type: Anchor
  layout:
    flex: 0 0 auto
  properties:
    title: Go Home
    home: true
    icon: AiOutlineHome
```

```yaml
- id: shortcut_docs
  type: Anchor
  layout:
    flex: 0 0 auto
  properties:
    title: Documentation
    url: https://docs.lowdefy.com
    icon: AiOutlineBook
  events:
    onClick:
      shortcut: mod+shift+d
      try:
        - id: docs_msg
          type: DisplayMessage
          params:
            content: Opening docs...
            status: info
```

```yaml
- id: style_bold
  type: Anchor
  layout:
    flex: 0 0 auto
  style:
    .element:
      fontWeight: bold
      fontSize: 16
  properties:
    title: Bold Link
    url: https://lowdefy.com
- id: style_colored
  type: Anchor
  layout:
    flex: 0 0 auto
  style:
    .element:
      color: "#52c41a"
  properties:
    title: Green Link
    url: https://lowdefy.com
- id: style_underline
  type: Anchor
  layout:
    flex: 0 0 auto
  style:
    .element:
      textDecoration: underline
      color: "#722ed1"
  properties:
    title: Underlined Purple Link
    url: https://lowdefy.com
- id: style_button_like
  type: Anchor
  layout:
    flex: 0 0 auto
  style:
    .element:
      background: "#1677ff"
      color: "#ffffff"
      padding: 8px 16px
      borderRadius: 6
      textDecoration: none
      fontWeight: 500
  properties:
    title: Button-Style Link
    url: https://lowdefy.com
- id: style_outline
  type: Anchor
  layout:
    flex: 0 0 auto
  style:
    .element:
      border: 1px solid
      color: "#1677ff"
      padding: 8px 16px
      borderRadius: 6
      textDecoration: none
  properties:
    title: Outlined Link
    url: https://lowdefy.com
- id: style_large_icon
  type: Anchor
  layout:
    flex: 0 0 auto
  style:
    .element:
      fontSize: 20
      color: "#ff4d4f"
  properties:
    title: Large Red Link
    url: https://lowdefy.com
    icon: AiOutlineHeart
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `ariaLabel` | string | - | Arial-label to apply to link tag. |
| `back` | boolean | - | When the link is clicked, trigger the browser back. |
| `home` | boolean | - | When the link is clicked, route to the home page. |
| `input` | object | - | When the link is clicked, pass data as the input object to the next Lowdefy page.  Can only be used with pageId link and newTab false. |
| `urlQuery` | object | - | When the link is clicked, pass data as a url query to the next page. |
| `disabled` | boolean | `false` | Disable the anchor if true. |
| `icon` | string \| object | - | Name of an React-Icon (See all icons) or properties of an Icon block for anchor icon. |
| `pageId` | string | - | When the link is clicked, route to the provided Lowdefy page. |
| `href` | string | - | The href to link to when the anchor link is clicked. |
| `url` | string | - | External url to link to when the anchor link is clicked. |
| `rel` | string | `"noopener noreferrer"` | The relationship of the linked URL as space-separated link types. |
| `newTab` | boolean | `false` | Open link in a new tab when the anchor link is clicked. |
| `replace` | boolean | `false` | Prevent adding a new entry into browser history by replacing the url instead of pushing into history. Can only be used with pageId link and newTab false. |
| `scroll` | boolean | `false` | Disable scrolling to the top of the page after page transition. Can only be used with pageId link and newTab false. |
| `title` | string | - | Text to display in the anchor. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onClick` | \- | Called when Anchor is clicked. Renders a shortcut badge when a shortcut is configured. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The anchor element. |
| `/icon` | The icon in the Anchor. |

No slots defined.
