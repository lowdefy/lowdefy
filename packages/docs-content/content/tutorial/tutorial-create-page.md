# 2. Creating a page

Let's create a page for a web form where users can log a new ticket.

#### 2.1. Create `new-ticket.yaml`

Create a new YAML file in the project directory (the same directory as the `lowdefy.yaml` file) called `new-ticket.yaml`, with the following content:

```yaml
id: new-ticket
type: PageHeaderMenu
properties:
  title: New ticket # The title in the browser tab.
layout:
  justify: center # Center the contents of the page.
blocks:
  - id: content_card
    type: Card
    layout:
      size: 800 # Set the size of the card so it does not fill the full screen.
      gap: 16 # Make a 16px gap between all blocks in this card.
    blocks:
      - id: page_heading
        type: Title
        properties:
          content: Log a ticket # Change the title on the page.
          level: 3 # Make the title a little smaller (an html `<h3>`).
```

#### 2.2. Update `lowdefy.yaml`

Change the `lowdefy.yaml` to look like this:

```yaml
name: lowdefy-project-template
lowdefy: 5.5.1

pages:
################ -------- Copy from here -------- ################
  - _ref: new-ticket.yaml
################ -------- Copy to here ---------- ################
  - id: welcome
    type: PageHeaderMenu
    properties:
      title: Welcome
    # ...
```

> Indentation is important

#### 2.3. Navigate to the new page

Your browser should reload, and you should see a link in the header menu to the booking page. If you click on that link it should take you to a page that looks like this:

Log a ticket

If you click on the link in the menu, you should see that your browser path (the part after `localhost:3000` or `example.com`) changes from `welcome` to `new-ticket`.

### What happened

- We created a new page with id `new-ticket`.
- We used the [`_ref` operator](/_ref) to reference configuration in another file.
- That page can now be found at the `/new-ticket` route.
- A link to that page was created in the menu. These links are in the order of the pages.

## Menus

A menu is created by default from all the pages in your app, in the order that they appear in the pages array. Often more control is needed over the menu. You might want to group menu items into different groups, change the title, exclude a page or add an icon. To do this, we can define a menu in the `menus` section of the `lowdefy.yaml` file.

#### 2.4 - Add the menu configuration

Copy the following and add it to your `lowdefy.yaml` file just before the pages section:

```yaml
################ -------- Copy from here -------- ################
menus:
  - id: default
    links:
      - id: new-ticket
        type: MenuLink
        properties:
          icon: AiOutlineAlert
          title: New ticket
        pageId: new-ticket
      - id: welcome
        type: MenuLink
        properties:
          icon: AiOutlineHome
          title: Home
        pageId: welcome
################ -------- Copy to here ---------- ################
pages:
  - _ref: new-ticket.yaml
    # ...
```

The menu links will now have icons and titles.

> If you would like to see how your config should look at this point, you can find it [here](https://github.com/lowdefy/lowdefy-example-tutorial/tree/main/02-creating-a-page).

### Up next

In the next section we will add some more blocks to our page to create a form to capture the ticket data.
