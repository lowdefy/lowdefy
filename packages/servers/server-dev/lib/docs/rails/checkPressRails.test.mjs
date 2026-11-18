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

import checkPressRails from './checkPressRails.js';

// The page's first evaluate arms the auth recorder; the second reads what the focused element
// sits in, the shown page, its blocks and the shortcuts they bind.
function createPage({
  pageId = 'rails',
  wrappers = [],
  control = null,
  portals = [],
  blockIds = [],
  shortcuts = [],
} = {}) {
  return {
    evaluate: vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce({
      pageId,
      around: { wrappers, control, portals },
      blockIds,
      shortcuts,
    }),
  };
}

function createJourney(refused) {
  return {
    dataSetRails: {
      refusal: vi.fn(({ blockId }) =>
        refused.includes(blockId)
          ? { message: `Block "${blockId}" is refused.`, actual: 'a refused press' }
          : null
      ),
    },
  };
}

const SHORTCUTS = [
  { blockId: 'save_button', shortcut: 'mod+s' },
  { blockId: 'search_button', shortcut: '/' },
];

test('a journey without a data set is not railed', async () => {
  const page = createPage();
  await expect(
    checkPressRails({ journey: {}, page, key: 'Meta+s', modifier: 'Meta' })
  ).resolves.toBe(null);
  expect(page.evaluate).not.toHaveBeenCalled();
});

test('a press that fires a railed block shortcut is refused before it is pressed', async () => {
  const journey = createJourney(['save_button']);
  await expect(
    checkPressRails({
      journey,
      page: createPage({ shortcuts: SHORTCUTS }),
      key: 'Meta+s',
      modifier: 'Meta',
    })
  ).rejects.toThrow('Block "save_button" is refused.');
  expect(journey.dataSetRails.refusal).toHaveBeenCalledWith({
    pageId: 'rails',
    blockId: 'save_button',
    step: 'press',
  });
});

test('a refused press names the step in its expected text', async () => {
  const error = await checkPressRails({
    journey: createJourney(['save_button']),
    page: createPage({ shortcuts: SHORTCUTS }),
    key: 'Meta+s',
    modifier: 'Meta',
  }).catch((caught) => caught);
  expect(error.expected).toBe('a press a data-set journey can make');
  expect(error.actual).toBe('a refused press');
});

test('a press on an unrailed block passes and returns that block', async () => {
  const journey = createJourney(['save_button']);
  await expect(
    checkPressRails({
      journey,
      page: createPage({ shortcuts: SHORTCUTS }),
      key: '/',
      modifier: 'Meta',
    })
  ).resolves.toBe('search_button');
  expect(journey.dataSetRails.refusal).toHaveBeenCalledTimes(1);
});

test('a press is checked against the block around the focused element', async () => {
  const journey = createJourney(['login_input']);
  await expect(
    checkPressRails({
      journey,
      page: createPage({ wrappers: ['login_input'], shortcuts: SHORTCUTS }),
      key: 'Enter',
      modifier: 'Meta',
    })
  ).rejects.toThrow('Block "login_input" is refused.');
});

test('a press reaching the focused block and a shortcut checks both and names neither', async () => {
  const journey = createJourney([]);
  await expect(
    checkPressRails({
      journey,
      page: createPage({ wrappers: ['notes_input'], shortcuts: SHORTCUTS }),
      key: 'Meta+s',
      modifier: 'Meta',
    })
  ).resolves.toBe(null);
  expect(journey.dataSetRails.refusal.mock.calls.map(([call]) => call.blockId)).toEqual([
    'notes_input',
    'save_button',
  ]);
});

test('a press that fires no block passes unchecked', async () => {
  const journey = createJourney(['save_button']);
  await expect(
    checkPressRails({
      journey,
      page: createPage({ shortcuts: SHORTCUTS }),
      key: 'Escape',
      modifier: 'Meta',
    })
  ).resolves.toBe(null);
  expect(journey.dataSetRails.refusal).not.toHaveBeenCalled();
});

test('a press while no Lowdefy page shows is not checked', async () => {
  const journey = createJourney(['save_button']);
  await expect(
    checkPressRails({
      journey,
      page: createPage({ pageId: null, wrappers: ['save_button'] }),
      key: 'Enter',
      modifier: 'Meta',
    })
  ).resolves.toBe('save_button');
  expect(journey.dataSetRails.refusal).not.toHaveBeenCalled();
});

test('a press is checked against every block wrapper around the focused element', async () => {
  const journey = createJourney(['form_box']);
  await expect(
    checkPressRails({
      journey,
      page: createPage({ wrappers: ['save_button', 'form_box'] }),
      key: 'Enter',
      modifier: 'Meta',
    })
  ).rejects.toThrow('Block "form_box" is refused.');
});

test('a press on a focused input inside containers names the input', async () => {
  await expect(
    checkPressRails({
      journey: createJourney([]),
      page: createPage({ wrappers: ['name_input', 'form_box', 'page'] }),
      key: 'Enter',
      modifier: 'Meta',
    })
  ).resolves.toBe('name_input');
});

test('a press on a marked control in a portal is checked against the block that marks it', async () => {
  const journey = createJourney(['delete_modal']);
  await expect(
    checkPressRails({
      journey,
      page: createPage({ control: 'delete_modal' }),
      key: 'Enter',
      modifier: 'Meta',
    })
  ).rejects.toThrow('Block "delete_modal" is refused.');
});

test('a press in a modal portal is checked against the block whose portal class it carries', async () => {
  const journey = createJourney(['rows.0.edit_modal']);
  await expect(
    checkPressRails({
      journey,
      page: createPage({
        portals: ['ldf-portal-rows_0_edit_modal'],
        blockIds: ['rows.0.edit_modal', 'rows_0_edit_modal_title'],
      }),
      key: 'Escape',
      modifier: 'Meta',
    })
  ).rejects.toThrow('Block "rows.0.edit_modal" is refused.');
  expect(journey.dataSetRails.refusal).toHaveBeenCalledTimes(1);
});
