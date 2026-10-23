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
import { expect } from 'vitest';

// One person writes, a second person (`as:`) reads it, in the same run and the same
// data set database. The page shows who it is open as, so the journey also sees that each
// person has their own session.

const base = {
  pageId: 'handoff',
  data: 'handoff',
  user: 'writer',
};

fixtureTest('a note one user saves is read by a second user in the same run', async () => {
  const result = await postJourney({
    ...base,
    steps: [
      { expect: { text: { blockId: 'handoff_whoami', contains: 'Open as u_writer' } } },
      { fill: { blockId: 'note_input', value: 'Please review the override' } },
      { click: 'save_note_button' },
      { wait: { request: 'save_note' } },
      { as: 'reader' },
      { wait: { request: 'get_notes' } },
      { expect: { text: { blockId: 'handoff_whoami', contains: 'Open as u_reader' } } },
      {
        expect: {
          text: {
            blockId: 'latest_note',
            contains: 'Latest note: Please review the override by u_writer',
          },
        },
      },
      { as: 'main' },
      { expect: { text: { blockId: 'handoff_whoami', contains: 'Open as u_writer' } } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest('the second user sees nothing the first has not written yet', async () => {
  const result = await postJourney({
    ...base,
    steps: [
      { as: 'reader' },
      { wait: { request: 'get_notes' } },
      { expect: { hidden: 'latest_note' } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest(
  'each run has a database of its own, so a note from one run is not in the next',
  async () => {
    const result = await postJourney({
      ...base,
      user: 'reader',
      steps: [{ wait: { request: 'get_notes' } }, { expect: { hidden: 'latest_note' } }],
    });
    expect(result.failure).toBeUndefined();
    expect(result.passed).toBe(true);
  }
);

fixtureTest('an as that names no user of the data set is refused and names the users', async () => {
  const result = await postJourney({
    ...base,
    steps: [{ as: 'nobody' }, { expect: { hidden: 'latest_note' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.message).toContain('"as" names "nobody"');
  expect(result.failure.message).toContain('reader');
});

fixtureTest('the exercised path is the union of what both people touched', async () => {
  const result = await postJourney({
    ...base,
    steps: [
      { fill: { blockId: 'note_input', value: 'Hello' } },
      { click: 'save_note_button' },
      { wait: { request: 'save_note' } },
      { as: 'reader' },
      { wait: { request: 'get_notes' } },
      { expect: { visible: 'latest_note' } },
    ],
  });
  expect(result.failure).toBeUndefined();
  const requests = result.exercised.requests.map(({ requestId, write }) => ({ requestId, write }));
  expect(requests).toEqual(
    expect.arrayContaining([
      { requestId: 'save_note', write: true },
      { requestId: 'get_notes', write: false },
    ])
  );
});
