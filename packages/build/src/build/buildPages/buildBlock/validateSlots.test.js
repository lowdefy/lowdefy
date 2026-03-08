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

import { jest } from '@jest/globals';

import validateSlots from './validateSlots.js';

function createPageContext(blockMetas = {}) {
  return {
    context: {
      handleWarning: jest.fn(),
      blockMetas,
    },
  };
}

test('validateSlots does nothing when no block meta found', () => {
  const pageContext = createPageContext();
  const block = { blockId: 'b1', type: 'Unknown', slots: { content: { blocks: [] } } };
  validateSlots(block, pageContext);
  expect(pageContext.context.handleWarning).not.toHaveBeenCalled();
});

test('validateSlots does nothing when block meta has no slots field', () => {
  const pageContext = createPageContext({ Card: { cssKeys: ['element'] } });
  const block = { blockId: 'b1', type: 'Card', slots: { anything: { blocks: [] } } };
  validateSlots(block, pageContext);
  expect(pageContext.context.handleWarning).not.toHaveBeenCalled();
});

test('validateSlots does nothing when slots is false (opt-out)', () => {
  const pageContext = createPageContext({ Tabs: { slots: false } });
  const block = { blockId: 'b1', type: 'Tabs', slots: { anything: { blocks: [] } } };
  validateSlots(block, pageContext);
  expect(pageContext.context.handleWarning).not.toHaveBeenCalled();
});

test('validateSlots does nothing when block has no slots', () => {
  const pageContext = createPageContext({ Card: { slots: ['content', 'title'] } });
  const block = { blockId: 'b1', type: 'Card' };
  validateSlots(block, pageContext);
  expect(pageContext.context.handleWarning).not.toHaveBeenCalled();
});

test('validateSlots allows valid slot names', () => {
  const pageContext = createPageContext({
    Card: { slots: ['content', 'title', 'cover', 'extra'] },
  });
  const block = {
    blockId: 'b1',
    type: 'Card',
    slots: {
      content: { blocks: [] },
      title: { blocks: [] },
      extra: { blocks: [] },
    },
  };
  validateSlots(block, pageContext);
  expect(pageContext.context.handleWarning).not.toHaveBeenCalled();
});

test('validateSlots warns on unknown slot name', () => {
  const pageContext = createPageContext({
    Card: { slots: ['content', 'title', 'cover', 'extra'] },
  });
  const block = {
    blockId: 'b1',
    type: 'Card',
    slots: { footer: { blocks: [] } },
  };
  validateSlots(block, pageContext);
  expect(pageContext.context.handleWarning).toHaveBeenCalledTimes(1);
  expect(pageContext.context.handleWarning.mock.calls[0][0].message).toContain(
    'Unknown slot "footer"'
  );
  expect(pageContext.context.handleWarning.mock.calls[0][0].message).toContain(
    'content, title, cover, extra'
  );
});

test('validateSlots warns on multiple unknown slots', () => {
  const pageContext = createPageContext({ Box: { slots: ['content'] } });
  const block = {
    blockId: 'b1',
    type: 'Box',
    slots: {
      content: { blocks: [] },
      header: { blocks: [] },
      footer: { blocks: [] },
    },
  };
  validateSlots(block, pageContext);
  expect(pageContext.context.handleWarning).toHaveBeenCalledTimes(2);
});

test('validateSlots uses slot configKey when available', () => {
  const pageContext = createPageContext({ Card: { slots: ['content'] } });
  const block = {
    blockId: 'b1',
    type: 'Card',
    '~k': 'block-key',
    slots: { unknown: { blocks: [], '~k': 'slot-key' } },
  };
  validateSlots(block, pageContext);
  expect(pageContext.context.handleWarning.mock.calls[0][0].configKey).toBe('slot-key');
});

test('validateSlots falls back to block configKey when slot has no configKey', () => {
  const pageContext = createPageContext({ Card: { slots: ['content'] } });
  const block = {
    blockId: 'b1',
    type: 'Card',
    '~k': 'block-key',
    slots: { unknown: { blocks: [] } },
  };
  validateSlots(block, pageContext);
  expect(pageContext.context.handleWarning.mock.calls[0][0].configKey).toBe('block-key');
});
