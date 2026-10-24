---
'@lowdefy/blocks-native': patch
---

fix(blocks-native): Markdown link chips wrap with the text as inline words

A link chip in a list item or paragraph took the whole line when its title was long, so the rest of the sentence wrapped onto a new line that started with its full stop. A chip is now as wide as its content, at most three quarters of the line when text follows it (the whole line when it ends the paragraph), measured against the text it sits in, so a chip in a list item is capped by the item's text column rather than the block's width. Past that its title is cut short and its key never is. Closing punctuation right after a chip (`.`, `,`, `;`, `:`, `)`, `?`, `!`) is drawn inside the chip's inline view, so it never starts a line, and a chip that does not fit on a line moves to the next one whole.
