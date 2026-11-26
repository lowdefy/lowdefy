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

import runTestJourney, { readLog, record } from './tests/runTestJourney.js';

function page({ autoOpen = true, disabled = false, events, type = 'MultipleSelector', visible }) {
  return {
    id: 'home',
    blocks: [
      {
        id: 'picker',
        type,
        visible,
        properties: { autoOpen, disabled, options: ['a', 'b'] },
        events,
      },
      { id: 'save', type: 'Button', events: { onClick: [record('save')] } },
    ],
  };
}

const ON_OPEN_CHANGE = { onOpenChange: [record('onOpenChange')] };

test.each(['MultipleSelector', 'Selector', 'DateSelector'])(
  'A %s that opened itself with onOpenChange actions leaves the next interaction to a browser',
  async (blockType) => {
    const { log, result } = await runTestJourney({
      pages: [page({ events: ON_OPEN_CHANGE, type: blockType })],
      steps: [{ expect: { visible: 'picker' } }, { click: 'save' }],
    });
    expect(result.browserOnly).toEqual({
      index: 1,
      reason: `Block "picker" (${blockType}) opened its dropdown as it rendered (autoOpen) and has onOpenChange actions, which a browser fires as a step closes the dropdown or acts in it and a headless run does not model: the step runs in a browser.`,
      step: { click: 'save' },
    });
    expect(log).toEqual([]);
  }
);

test('No autoOpen, no onOpenChange actions, a disabled or a hidden block: the click runs headless', async () => {
  const pages = [
    page({ autoOpen: false, events: ON_OPEN_CHANGE }),
    page({ events: {} }),
    page({ disabled: true, events: ON_OPEN_CHANGE }),
    page({ events: ON_OPEN_CHANGE, visible: false }),
  ];
  for (const one of pages) {
    const { log, result } = await runTestJourney({ pages: [one], steps: [{ click: 'save' }] });
    expect(result.passed).toBe(true);
    expect(readLog(log)).toEqual([['save']]);
  }
});
