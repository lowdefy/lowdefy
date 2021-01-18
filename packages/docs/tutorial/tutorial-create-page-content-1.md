Let's create a page for a form where users can log a new ticket.

#### Step 1

Create a new YAMl file in the pages directory called `new-ticket.yaml`, with the following content:

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

#### Step 2

Change the `lowdefy.yaml` to look like this:

```yaml
name: lowdefy-project-template
lowdefy: CURRENT_LOWDEFY_VERSION

pages:
  - _ref: pages/welcome.yaml
  - _ref: pages/new-ticket.yaml
```
