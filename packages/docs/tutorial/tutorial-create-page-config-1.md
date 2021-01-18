##### `lowdefy.yaml`

```yaml
name: lowdefy-project-template
version: CURRENT_LOWDEFY_VERSION

menus:
  - id: default
    links:
      - id: welcome
        type: MenuLink
        properties:
          icon: HomeOutlined
          title: Home
        pageId: welcome
      - id: new-ticket
        type: MenuLink
        properties:
          icon: AlertOutlined
          title: New ticket
        pageId: new-ticket

pages:
  - _ref: pages/welcome.yaml
  - _ref: pages/booking.yaml
```

##### `pages/booking.yaml`

```yaml
id: new-ticket
type: PageHeaderMenu
properties:
  title: New ticket # The title in the browser tab.
layout:
  contentJustify: center # Center the contents of the page.
blocks:
  - id: content_card
    type: Card
    layout:
      size: 800 # Set the size of the card so it does not fill the full screen.
      contentGutter: 16 # Make a 16px gap between all blocks in this card.
    blocks:
      - id: page_heading
        type: Title
        properties:
          content: Log a ticket # The content text of the title block.
          level: 3 # Make the title a little smaller (an html `<h3>`).
```
