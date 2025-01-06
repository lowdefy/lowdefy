# Working with Forms in Lowdefy

## Pt. 3: Dropdown Selectors

In our previous post, we discussed checkboxes and radio selectors.

These elements are perfect for a limited set of static options, displaying all available options simultaneously.

There are many situations, however, that would benefit from the functionality and UI of dropdown selectors.

Lowdefy features 2 types of dropdowns: Selector and MultipleSelector.

Dropdowns are more compact and offer different functionality, both of which make them better suited for certain situations.

## Selector

Like the RadioSelector, the Selector block allows a user to select multiple values from a list of options.

The Selector is much more compact and offers additional functionality.

### UI

Dropdowns can provide more options than radio selectors, as the dropdowns can collapse.

Checkboxes do allow the user to see multiple options simultaneously, but this also takes up more space on the screen.

### Functionality

Lowdefy's Selectors have another advantage over standard radio selectors, in that they can be dynamic.

A Selector block can be configured to display an entirely different set of options depending on the state of the Lowdefy app.

## MultipleSelector

Like checkboxes

## Learn More

The Selector and MultipleSelector blocks are useful alternatives to checkboxes and radio selectors, with each having their own pros and cons. Dropdowns are more compact, and can dynamically present stuff.

Our next post in this series will detail how to handle date and time in Lowdefy.

Start your own Lowdefy project to try out Selectors in Lowdefy

```bash
pnpx lowdefy@4 init && pnpx lowdefy@4 dev
 # note: requires node v18 (or newer) and pnpm
```

Don't forget to look through our [docs](https://docs.lowdefy.com/Selector) for more details on features and implementation.
