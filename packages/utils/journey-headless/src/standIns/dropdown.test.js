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

import { expect, test } from 'vitest';

import runTestJourney, { readLog, record } from '../tests/runTestJourney.js';

// A dropdown with `trigger: contextMenu` opens only on a right click: a plain click on the block
// does nothing, and a control click opens it first, as the browser runner right-clicks its
// trigger (runJourneySteps openDropdown).

function contextMenuPage() {
  return {
    id: 'home',
    blocks: [
      {
        id: 'notes',
        type: 'DropdownMenu',
        properties: { trigger: 'contextMenu', links: [{ id: 'pin' }] },
        events: { onClick: [record('onClick')], onOpenChange: [record('onOpenChange')] },
        blocks: [{ id: 'notes_label', type: 'Paragraph' }],
      },
      {
        id: 'actions',
        type: 'DropdownButton',
        properties: { trigger: 'contextMenu', items: [{ title: 'Edit', eventName: 'onEdit' }] },
        events: { onEdit: [record('onEdit')], onOpenChange: [record('onOpenChange')] },
      },
    ],
  };
}

test('contextMenu DropdownMenu and DropdownButton do not open on a plain click', async () => {
  const { log, result } = await runTestJourney({
    pages: [contextMenuPage()],
    steps: [{ click: 'notes' }, { click: 'actions' }],
  });
  expect(result.passed).toBe(true);
  expect(log).toEqual([]);
});

test('contextMenu DropdownMenu item control opens the dropdown first, then fires the item', async () => {
  const { log, result } = await runTestJourney({
    pages: [contextMenuPage()],
    steps: [{ click: { blockId: 'notes', control: 'pin' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onOpenChange', { open: true }],
    ['onClick', { key: 'pin', keyPath: ['pin'] }],
    ['onOpenChange', { open: false }],
  ]);
});

test('contextMenu DropdownButton item control opens the dropdown first, then fires the item', async () => {
  const { log, result } = await runTestJourney({
    pages: [contextMenuPage()],
    steps: [{ click: { blockId: 'actions', control: 'onEdit' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onOpenChange', { open: true }],
    ['onEdit'],
    ['onOpenChange', { open: false }],
  ]);
});
