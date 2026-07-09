# 3. Adding blocks

We would like to add an input form with the following fields:

- A title for the ticket.
- The type of ticket. This should be a selection from a list of types.
- A description of the ticket.

There should also be submit and reset buttons at the bottom of the page.

#### 3.1. Add some input blocks

Copy the following blocks and add them in the card's blocks array.

###### `new-ticket.yaml`
```yaml
id: new-ticket
    # ...
blocks:
  - id: content_card
    # ...
    blocks:
      - id: page_heading
        type: Title
        properties:
          content: Log a ticket # Change the title on the page.
          level: 3 # Make the title a little smaller (an html `<h3>`).
################ ------- Copy from here -------- ################
      - id: ticket_title
        type: TextInput
        properties:
          title: Title
      - id: ticket_type
        type: ButtonSelector
        properties:
          title: Ticket type
          options: # Set the allowed options
            - Suggestion
            - Complaint
            - Question
      - id: ticket_description
        type: TextArea
        properties:
          title: Description
      - id: reset_button
        type: Button
        layout:
          span: 12 # Set the size of the button (span 12 of 24 columns)
        properties:
          title: Reset
          block: true # Make the button fill all the space available to it
          type: default # Make the button a plain button
          icon: AiOutlineClear
      - id: submit_button
        type: Button
        layout:
          span: 12
        properties:
          title: Submit
          block: true
          type: primary # Make the button a primary button with color
          icon: AiOutlineSave
################ -------- Copy to here ---------- ################
```

Your new-ticket page should look something like this:

Log a ticket

>  If you would like to see how your config should look at this point, you can find it [here](https://github.com/lowdefy/lowdefy-example-tutorial/tree/main/03-adding-blocks).

### What happened

We added 3 form input blocks to the page. For each of those blocks, we set the `title` property, and for the ticket type selector we set a list of ticket types to the `options` property.

We also added reset button and submit button. We set a few more properties on the buttons to set their layout and appearance.

### How it works

Lowdefy apps are made from blocks. These blocks can be the page layout with header and menu, a piece of text, a chart or table, tabs or even a popup message or icon. You specify which block is rendered with the `type` field. There are 4 block categories, namely display, input, container, and list.

All blocks need to have an `id` that identifies the block. Blocks of category input and list use this `id` as the object key to represent a value in page state, but more on this later.

### Up next

Currently our form doesn't do very much. In the next section we will use [actions](/events-and-actions) and [operators](/operators) to make it more interactive.
