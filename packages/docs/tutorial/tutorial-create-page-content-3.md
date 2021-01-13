#### Step 4

If you click on the links in the menu, you should see that your browser path (the part after lowdefy.com) changes from `welcome` to `booking`.

### What happened

- We created a new page with id `booking`.
- We used a `_ref` operator to reference configuration in another file.
- That page can now be found at the `/booking` route.
- A link to that page was created in the menu. These links are in the order of the pages.

## Menus

A menu is created by default from all the pages in your app, in the order that they appear in the pages array. Often more control is needed over the menu. You might want to group menu items into different groups, change the title, exclude a page or add an icon. To do this, we can define a menu in the `menus` section of the `lowdefy.yaml` file.

#### Step 1

Copy the following:

```yaml
################ -------- Copy from here -------- ################
menus:
  - id: default
    links:
      - id: welcome
        type: MenuLink
        properties:
          icon: HomeOutlined
          title: Home
        pageId: welcome
      - id: booking
        type: MenuLink
        properties:
          icon: CalendarOutlined
          title: Book a meeting
        pageId: booking
################ ------- Copy to here ----------- ################
pages:
  - id: welcome
    # ...
```

The menu links will now have icons and titles.

>  If you would like to see how your config should look at this point, you can find it [here](tutorial-create-page-config).

### Up next

In the next section we will add some more blocks to our page to create a form for users to book a meeting room.

