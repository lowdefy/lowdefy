---
'@lowdefy/test-utils': minor
---

feat(test-utils): New package with a table of who can reach which page and endpoint

`@lowdefy/test-utils` opens a built app in a Node test, in the test's own process. This first release gives the access table: `app.accessMatrix({ data })` asks the authorization gate about every page and every endpoint of the build, as each user of a `tests/data` data set and as a signed out caller, and returns `allow`, `deny` or `enrol_required` for each. It starts no server, browser or database, and answers hundreds of pages by tens of users in milliseconds, so an app can commit the table as a snapshot and review any change to it.

```js
import { test } from 'node:test';
import { openTestApp } from '@lowdefy/test-utils';

const app = await openTestApp();

test('who can reach what', async (t) => {
  t.assert.snapshot(await app.accessMatrix({ data: 'roles' }));
});
```

Build first with `lowdefy build --no-client-build`, and run the tests from the app's config directory. `openTestApp({ configDirectory, serverDirectory })` names an app or a built server somewhere else; the server defaults to `<configDirectory>/.lowdefy/server`.

- `openTestApp` refuses a missing build, a build of another Lowdefy version than its own, and a build older than a config file it read, each naming the command to run. The last check is best effort: it compares the config files the build listed and does not see a changed plugin, environment value or ref resolver input.
- An `InternalApi` endpoint answers `deny` for every caller, since no caller can call one.
- A data set user is asked to enrol a second factor only when it carries `two_factor_enrolled: false`.
