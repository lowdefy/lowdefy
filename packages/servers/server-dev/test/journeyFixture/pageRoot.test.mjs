/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { fixtureTest, postJourney } from './fixtureClient.mjs';

// The one-step journey that proves a finding at open:
// `expect: { visible: <pageId> }`, the page's root block showing. The build
// gives the root block the page id as its blockId, and the client renders
// every block, the root included, inside a `#bl-<blockId>` wrapper. A page
// that sends the caller elsewhere at open does not fail the open: the runner
// waits for whichever page the app shows, and the expectation decides.

fixtureTest('expect.visible on the page id passes on a page the user may see', async () => {
  const result = await postJourney({
    pageId: 'home',
    steps: [{ expect: { visible: 'home' } }],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest('expect.visible on the page id passes on a data set as a data set user', async () => {
  const result = await postJourney({
    pageId: 'explore',
    data: 'explore',
    user: 'member',
    steps: [{ expect: { visible: 'explore' } }],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest(
  'a page that redirects at open fails at the expect.visible step, not at open',
  async () => {
    // explore_guarded admits everyone but its onInit links home.
    const result = await postJourney({
      pageId: 'explore_guarded',
      timeout: 2000,
      steps: [{ expect: { visible: 'explore_guarded' } }],
    });
    expect(result.passed).toBe(false);
    expect(result.failure).toEqual(
      expect.objectContaining({
        index: 0,
        message: 'Expected block "explore_guarded" to be visible.',
        expected: 'block "explore_guarded" to be visible',
      })
    );
    expect(result.failure.phase).toBeUndefined();
  }
);

fixtureTest('a page the server refuses fails at the expect.visible step, not at open', async () => {
  // A page whose auth refuses the caller's roles and a page that does not
  // exist get the same answer from the page route (404 "Page not found."),
  // and the client replaces the URL with /404.
  const result = await postJourney({
    pageId: 'not_a_fixture_page',
    timeout: 2000,
    steps: [{ expect: { visible: 'not_a_fixture_page' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure).toEqual(
    expect.objectContaining({
      index: 0,
      message: 'Expected block "not_a_fixture_page" to be visible.',
    })
  );
  expect(result.failure.phase).toBeUndefined();
});
