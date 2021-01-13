### What happened

We added 5 form input blocks to the page. For each of those blocks, we set the `title` property, and for the meeting room selector we set a list of meeting rooms to the options property.

We also added reset button and submit button. We set a few more properties on the buttons to set their layout and appearance.


### How it works

Lowdefy apps are made from blocks. These blocks can be the page layout with header and menu, a piece of text, a chart or table, tabs or even a popup message or icon. You specify which block is rendered with the `type` field. There are 5 block categories, namely display, input, container, list, and context.

The first block on a page needs to be a context block. For now, it is enough to understand that this context allows the Lowdefy magic to happen.

All blocks need to have an `id` that identifies the block. This id should be unique in that block's context.


### Up next

Currently our form doesn't do very much. In the next section we will use [actions](actions) and [operators](operators) to make it more interactive.

