---
'@lowdefy/block-dev': patch
---

fix(deps): Update Testing Library to @testing-library/react 16.3.3, @testing-library/dom 10.4.2 and @testing-library/user-event 14.6.9

`@lowdefy/block-dev`'s block test helpers now render with `@testing-library/react` 16 and `@testing-library/dom` 10. The helpers use only `render`, `waitFor`, `screen.getByTestId` and `userEvent.click`, which behave the same, so block tests built on them need no change. A plugin's own tests that import Testing Library directly and query by role may see different role names from `@testing-library/dom` 10's newer ARIA data. `@testing-library/react` 16 lists `@testing-library/dom` as a peer dependency, which `@lowdefy/block-dev` provides. vitest stays on 4.1.12.
