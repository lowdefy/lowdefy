# Moving from e2e-utils

Apps test their pages and endpoints with [journeys](/config-tests). `@lowdefy/e2e-utils` is no longer a way for an app to test: Lowdefy keeps it for its own block e2e suites, and its `lowdefy-e2e` scaffold command is gone. This page moves an app's Playwright specs to journeys.

A journey says what a spec said, in the YAML you build the app in. It runs on a real request and a real database, never a faked one; it runs headless in CI, with no browser, when it targets blocks by `blockId`; and the agent tools write, run and harden it.

## What each part of a spec becomes

| In an e2e-utils spec                                                 | In a journey                                                                                                                                         |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ldf.goto('/contact')`                                               | `pageId: contact` on the journey, or a `goto` step.                                                                                                  |
| `ldf.block(id).do.fill(text)`, `.do.click()`, `.do.select(label)`    | `fill: { blockId, value }`, `click: blockId`, `select: { blockId, value }`.                                                                          |
| `ldf.block(id).expect.visible()`, `.hidden()`                        | `expect: { visible: blockId }`, `expect: { hidden: blockId }`.                                                                                       |
| `ldf.block(id).expect.text(text)`                                    | `expect: { text: { blockId, contains } }`, in the browser.                                                                                           |
| `ldf.state(path).expect.toBe(value)`                                 | `expect: { state: { path, equals } }`.                                                                                                               |
| `ldf.request(id).expect.toFinish()`                                  | `wait: { request: id }`.                                                                                                                             |
| `ldf.request(id).expect.toHavePayload(payload)`, `.toHaveResponse()` | `expect: { calls: { request, payload } }` or `{ request, response }`, a partial match on the last call, headless.                                    |
| `ldf.url().expect.toMatch(...)`                                      | `expect: { url: { contains } }`.                                                                                                                     |
| `ldf.user({ roles: [admin] })`, the `user` of `mocks.yaml`           | The journey's `user`: an inline user, or a user of its [data set](/journey-data-sets).                                                               |
| `mdb.seed(...)` (`@lowdefy/community-plugin-e2e-mdb`)                | The `fixtures` of a [data set](/journey-data-sets). Each journey run gets a fresh in-memory database loaded with it.                                 |
| `ldf.mock.request` on one of the app's own requests                  | A data set that holds what the request reads, so the real request runs. A faked answer proves nothing about the request it replaces.                 |
| `ldf.mock.request` or `ldf.mock.api` for an outside service          | An entry with an `answer` in the journey's [`stubs`](/config-tests#stubs-and-forced-failures).                                                       |
| A mock that answers with an `error`                                  | A `stubs` entry with `fail`, which makes the real request throw with that message.                                                                   |
| `page.request.post(...)` to an endpoint                              | A [page-less journey](/config-tests#page-less-journeys) with `call` steps, read with `expect: { status }`, `expect: { error }` and `expect: { db }`. |

## An example

A spec that fills a form and checks the request finished:

```javascript
test('contact form submits successfully', async ({ ldf }) => {
  await ldf.goto('/contact');
  await ldf.block('name_input').do.fill('Jane Doe');
  await ldf.block('submit_btn').do.click();
  await ldf.request('submit_form').expect.toFinish();
  await ldf.state('form_submitted').expect.toBe(true);
});
```

The same check as a journey, which also proves what the request stored:

```yaml
# tests/journeys/contact.yaml
name: a visitor submits the contact form
pageId: contact
data: contact
steps:
  - fill: { blockId: name_input, value: Jane Doe }
  - click: submit_btn
  - wait: { request: submit_form }
  - expect: { state: { path: form_submitted, equals: true } }
  - expect: { db: { collection: messages, match: { name: Jane Doe }, count: 1 } }
```

It targets blocks by `blockId` and reads state and the database, so `lowdefy test --headless` runs it with no browser.

## Moving an app

1. Write a [data set](/journey-data-sets) in `tests/data/` from what the specs seeded with `mdb.seed` and what their mocks answered for the app's own requests.
2. Rewrite each spec as a journey in `tests/journeys/`. Check a page's logic, state and writes headless; keep `expect.text` for what only a browser shows. Rewrite each endpoint spec as a page-less journey, with a [case table](/config-tests#case-tables) where specs repeated one check over many inputs.
3. Run the journeys with `lowdefy test`: each runs headless when it can and in the browser when it can't.
4. Delete the specs, the `e2e/` folder with its `playwright.config.js`, `fixtures.js` and `mocks.yaml`, the `e2e` scripts in `package.json`, and the `@lowdefy/e2e-utils`, `@lowdefy/community-plugin-e2e-mdb` and `@playwright/test` dev dependencies.
5. In CI, run `lowdefy build` and then `lowdefy test --headless --build`.

A spec whose check is code against the page, such as `page.evaluate` or a locator of its own, has no journey form. Say what the person sees instead, with `expect: { text }` or `expect: { visible }`.
