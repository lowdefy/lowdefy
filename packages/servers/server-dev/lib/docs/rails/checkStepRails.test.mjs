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

import { vi, expect, test } from 'vitest';

import checkStepRails from './checkStepRails.js';

// The page answers every evaluate with the shown page id: arming the auth recorder ignores it.
function createPage() {
  return { evaluate: vi.fn(async () => 'rails') };
}

// The element a click resolved to, inside the block wrapper `wrapperId`.
function createLocator(wrapperId) {
  return { evaluate: vi.fn(async () => wrapperId) };
}

function createJourney(refused) {
  return {
    dataSetRails: {
      refusal: vi.fn(({ blockId }) =>
        refused.includes(blockId)
          ? { message: `Block "${blockId}" is refused.`, actual: 'a refused click' }
          : null
      ),
    },
  };
}

test('a journey without a data set is not railed', async () => {
  const page = createPage();
  const locator = createLocator('save_button');
  await expect(
    checkStepRails({
      journey: {},
      page,
      locator,
      target: { blockId: 'save_button' },
      step: 'click',
    })
  ).resolves.toBe(null);
  expect(page.evaluate).not.toHaveBeenCalled();
  expect(locator.evaluate).not.toHaveBeenCalled();
});

test('a plain target is checked against the block wrapper around the clicked element', async () => {
  const journey = createJourney(['grid']);
  const locator = createLocator('grid');
  await expect(
    checkStepRails({
      journey,
      page: createPage(),
      locator,
      target: { text: 'Delete' },
      step: 'click',
    })
  ).rejects.toThrow('Block "grid" is refused.');
  expect(locator.evaluate).toHaveBeenCalledTimes(1);
  expect(journey.dataSetRails.refusal).toHaveBeenCalledWith({
    pageId: 'rails',
    blockId: 'grid',
    step: 'click',
  });
});

test.each([
  ['a control target', { blockId: 'delete_modal', control: 'ok' }],
  ['a control target in a row', { blockId: 'delete_modal', rowKey: 'r-1', control: 'onVoid' }],
  ['a row key target', { blockId: 'delete_modal', rowKey: 'r-1' }],
])('%s is checked against its own block, with no element read', async (_, target) => {
  const journey = createJourney(['delete_modal']);
  // A modal footer or popup control sits outside every block wrapper.
  const locator = createLocator(null);
  await expect(
    checkStepRails({ journey, page: createPage(), locator, target, step: 'click' })
  ).rejects.toMatchObject({
    message: 'Block "delete_modal" is refused.',
    actual: 'a refused click',
  });
  expect(locator.evaluate).not.toHaveBeenCalled();
});

test('a control target is checked before it has an element', async () => {
  const journey = createJourney([]);
  await expect(
    checkStepRails({
      journey,
      page: createPage(),
      locator: null,
      target: { blockId: 'actions', control: 'onArchive' },
      step: 'click',
    })
  ).resolves.toBe('actions');
  expect(journey.dataSetRails.refusal).toHaveBeenCalledWith({
    pageId: 'rails',
    blockId: 'actions',
    step: 'click',
  });
});

test('a click outside every block is not refused', async () => {
  const journey = createJourney([]);
  await expect(
    checkStepRails({
      journey,
      page: createPage(),
      locator: createLocator(null),
      target: { text: 'OK' },
      step: 'click',
    })
  ).resolves.toBe(null);
  expect(journey.dataSetRails.refusal).not.toHaveBeenCalled();
});

test.each([
  ['open', 'an open a data-set journey can make'],
  ['fill', 'a fill a data-set journey can make'],
  ['select', 'a select a data-set journey can make'],
])('%s is checked against its block, in its own words', async (step, expected) => {
  const journey = createJourney(['menu']);
  await expect(
    checkStepRails({
      journey,
      page: createPage(),
      locator: createLocator('menu'),
      target: { blockId: 'menu' },
      step,
    })
  ).rejects.toMatchObject({ message: 'Block "menu" is refused.', expected });
  expect(journey.dataSetRails.refusal).toHaveBeenCalledWith({
    pageId: 'rails',
    blockId: 'menu',
    step,
  });
});

// The Search modal renders its input in a portal outside every block wrapper.
test('an element outside every block is checked against the block its target names', async () => {
  const journey = createJourney(['search']);
  await expect(
    checkStepRails({
      journey,
      page: createPage(),
      locator: createLocator(null),
      target: { blockId: 'search' },
      step: 'fill',
    })
  ).rejects.toThrow('Block "search" is refused.');
});
