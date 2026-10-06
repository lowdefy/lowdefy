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

// An action step's text or containing target must name exactly one visible
// element; an expectation accepts any match. Run by the real runner over the
// fixture app's targets page.

fixtureTest('click fails when a page-wide text matches several controls', async () => {
  const result = await postJourney({
    pageId: 'targets',
    timeout: 2000,
    steps: [{ expect: { visible: 'targets_title' } }, { click: { text: 'Delete' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.index).toBe(1);
  expect(result.failure.message).toBe(
    'Matched 3 controls with text "Delete" in the page; add nth: 0..2, or a blockId/row to narrow it.'
  );
  expect(result.failure.expected).toBe('exactly one control with text "Delete" in the page');
  expect(result.failure.actual).toBe('3 controls');
});

fixtureTest('click with nth acts on that match', async () => {
  const result = await postJourney({
    pageId: 'targets',
    steps: [
      { click: { text: 'Delete', nth: 1 } },
      { expect: { state: { path: 'deleted', equals: 'b' } } },
      { click: { text: 'Delete', nth: 0 } },
      { expect: { state: { path: 'deleted', equals: 'a' } } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest('click with a blockId narrows a shared text to one control', async () => {
  const result = await postJourney({
    pageId: 'targets',
    steps: [
      { click: { blockId: 'delete_c', text: 'Delete' } },
      { expect: { state: { path: 'deleted', equals: 'c' } } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest('a confirm dialog over the page is the one match for its text', async () => {
  const result = await postJourney({
    pageId: 'targets',
    steps: [
      { click: 'open_confirm_button' },
      { expect: { visible: 'confirm_delete_button' } },
      { click: { text: 'Delete' } },
      { expect: { state: { path: 'deleted', equals: 'all' } } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest('click fails when containing matches several elements in a block', async () => {
  const result = await postJourney({
    pageId: 'targets',
    timeout: 2000,
    steps: [{ click: { blockId: 'notes', containing: 'Shared note' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.message).toBe(
    'Matched 2 elements containing "Shared note" in block "notes"; add nth: 0..1, or a blockId/row to narrow it.'
  );
});

fixtureTest('open fails when a page-wide text matches several controls', async () => {
  const result = await postJourney({
    pageId: 'targets',
    timeout: 2000,
    steps: [{ open: { text: 'Delete' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.message).toBe(
    'Matched 3 controls with text "Delete" in the page; add nth: 0..2, or a blockId/row to narrow it.'
  );
});

fixtureTest('fill fails when containing matches several elements', async () => {
  const result = await postJourney({
    pageId: 'targets',
    timeout: 2000,
    steps: [{ fill: { blockId: 'notes', containing: 'Shared note', value: 'x' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.message).toBe(
    'Matched 2 elements containing "Shared note" in block "notes"; add nth: 0..1, or a blockId/row to narrow it.'
  );
});

fixtureTest('select fails when a text matches several controls', async () => {
  const result = await postJourney({
    pageId: 'targets',
    timeout: 2000,
    steps: [{ select: { blockId: 'delete_buttons', text: 'Delete', value: 'x' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.message).toBe(
    'Matched 3 controls with text "Delete" in block "delete_buttons"; add nth: 0..2, or a blockId/row to narrow it.'
  );
});

fixtureTest('expectations accept any of several matches', async () => {
  const result = await postJourney({
    pageId: 'targets',
    steps: [
      { expect: { visible: { text: 'Delete' } } },
      { expect: { visible: { blockId: 'notes', containing: 'Shared note' } } },
      { expect: { text: { blockId: 'notes', containing: 'Shared note', contains: 'one' } } },
      { expect: { hidden: { blockId: 'notes', containing: 'No such note' } } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest('a step that finds no match still reports it as not actionable', async () => {
  const result = await postJourney({
    pageId: 'targets',
    timeout: 1000,
    steps: [{ click: { text: 'No such button' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.message).toMatch(/^Control "No such button" was not actionable: /);
});
