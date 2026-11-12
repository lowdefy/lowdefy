---
'@lowdefy/actions-pdf-make': major
---

fix(deps)!: Update pdfmake to 0.3.14

The `PdfMake` action now builds PDFs with pdfmake 0.3. Its params are unchanged (`docDefinition`, `filename`, `fonts`, `tableLayouts`), and every 0.3 document definition feature can be used in `docDefinition`, including `section` nodes, `snakingColumns`, `verticalAlignment` on table cells, `tableAlignment`, `outline` bookmarks and styles that `extends` other styles.

**`pageBreakBefore` keeps its arguments in Lowdefy.** pdfmake 0.3 changed the `pageBreakBefore` function from `(currentNode, followingNodesOnPage, nodesOnNextPage, previousNodesOnPage)` to `(currentNode, nodeContainer)`, where `nodeContainer` only has methods such as `getFollowingNodesOnPage()`. Operators cannot call methods, so in a `_function` the second argument would have read as an empty object. The action calls those methods and passes the three lists as before, so a `pageBreakBefore` written with `_function` and `_args: 1`, `_args: 2` or `_args: 3` keeps working. Ignore the 0.3 signature in the pdfmake docs.

**Existing documents may lay out differently.** pdfmake 0.3 fixes many layout bugs and ships Roboto 3.016. Most text is placed exactly as before. These differences showed up when comparing documents built with 0.2.7 and 0.3.14:

- **`pageBreakBefore` rules take effect where 0.2.7 ignored them.** pdfmake 0.2.7 reported the wrong nodes to the function in some places, so a "no orphan headline" rule could leave a headline alone at the bottom of a page. With 0.3 the headline moves to the next page, which can change the page count.
- **An image with `cover` no longer jumps to a new page** and leaves the rest of the page blank.
- **Tables with percentage column widths mixed with `auto` or `*` columns** have slightly different column widths.
- **Tables stacked with a negative top margin and an empty header row**, as in the invoice example in the `PdfMake` docs, sit about 12pt lower.
- **Reversed numbered lists that contain a nested list** start at the right number (3, 2, 1 instead of 4, 3, 1).
- **Justified text with bold, italic or underlined fragments** has slightly different word spacing.

The pdfmake changelog lists more fixes to tables that break across pages, unbreakable blocks, list markers and text decoration, and an invalid colour name now renders black instead of the previous valid colour.

Other changes:

- **The action waits for the PDF.** It finishes when the file is handed to the browser to download, so actions after it run after the download starts. An error while building the PDF, such as a font that is not defined or an image URL that fails to load, now fails the action and runs its `catch` actions. Before, the action finished straight away and the error only showed in the browser console.
- **`Roboto` stays available when you pass `fonts`.** Fonts in `fonts` are added to the bundled Roboto font instead of replacing it. A document that uses `font: Roboto` with a `fonts` param that does not define it failed with 0.2.7 and now works. Define `Roboto` in `fonts` to replace it.
- Image and font URLs are downloaded by the user's browser with `fetch`, as they were with `XMLHttpRequest` before, so the server that hosts them must still allow cross-origin requests from your app. The action sets no URL access policy, since the download runs with the user's own network access.
