# E2E Testing

End-to-end (e2e) testing verifies that your Lowdefy app works correctly from the user's perspective. Instead of testing individual functions, e2e tests open a real browser, navigate through your pages, fill in forms, click buttons, and check that everything behaves as expected.

The `@lowdefy/e2e-utils` package provides a Playwright-based testing toolkit built specifically for Lowdefy apps. It understands Lowdefy's block system, state management, and request lifecycle, so you can write expressive tests without worrying about implementation details.

## What it provides

- **Locator-first API** — an intuitive pattern: get the thing, then do something with it
- **Request mocking** — control request responses with static YAML files or inline overrides
- **Block helpers** — type-aware interactions that know how to fill a TextInput, click a Button, or select from a Selector
- **User authentication** — set test users per browser context with cookie-based session injection
- **Scaffold command** — `npx @lowdefy/e2e-utils` sets up everything you need in seconds

## How it works

When you run your tests, Playwright:

1. Builds your Lowdefy app as a production build
2. Starts a local server
3. Opens a browser and runs your test code against the live app

The e2e server build exposes internal state on `window.lowdefy`, so your tests can assert on page state, request responses, and validation status.

## Prerequisites

- **Node.js 22+**
- A working Lowdefy app (your app must build successfully)
- **Playwright** (installed automatically during setup)

> E2e tests run against a production build of your app. If your app has build errors, the tests will not be able to start. Make sure <code>npx lowdefy build</code> succeeds before running tests.

## Quick example

Here is what a simple test looks like:

```javascript
import { test } from './fixtures.js';

test('contact form submits successfully', async ({ ldf }) => {
  await ldf.goto('/contact');

  await ldf.block('name_input').do.fill('Jane Doe');
  await ldf.block('email_input').do.fill('jane@example.com');
  await ldf.block('submit_btn').do.click();

  await ldf.request('submit_form').expect.toFinish();
  await ldf.state('form_submitted').expect.toBe(true);
  await ldf.url().expect.toBe('/thank-you');
});
```

The `ldf` object is your main testing helper. It is provided automatically by the test fixtures and gives you access to blocks, requests, state, and URL assertions.
