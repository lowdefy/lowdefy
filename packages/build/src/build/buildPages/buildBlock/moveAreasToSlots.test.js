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

import moveAreasToSlots from './moveAreasToSlots.js';

function createPageContext() {
  return {
    pageId: 'page1',
    context: {
      handleWarning: jest.fn(),
    },
  };
}

test('moveAreasToSlots does nothing when block has no areas', () => {
  const pageContext = createPageContext();
  const block = { blockId: 'b1' };
  moveAreasToSlots(block, pageContext);
  expect(block.slots).toBeUndefined();
  expect(pageContext.context.handleWarning).not.toHaveBeenCalled();
});

test('moveAreasToSlots moves areas to slots and warns', () => {
  const pageContext = createPageContext();
  const areas = { content: { blocks: [{ id: 'c1' }] } };
  const block = { blockId: 'b1', areas };
  moveAreasToSlots(block, pageContext);
  expect(block.slots).toBe(areas);
  expect(block.areas).toBeUndefined();
  expect(pageContext.context.handleWarning).toHaveBeenCalledTimes(1);
  expect(pageContext.context.handleWarning.mock.calls[0][0].message).toContain(
    '"areas" is deprecated, use "slots"'
  );
});

test('moveAreasToSlots throws when both areas and slots exist', () => {
  const pageContext = createPageContext();
  const block = {
    blockId: 'b1',
    areas: { content: { blocks: [] } },
    slots: { content: { blocks: [] } },
  };
  expect(() => moveAreasToSlots(block, pageContext)).toThrow(
    'cannot have both "areas" and "slots"'
  );
});

test('moveAreasToSlots does nothing when block has only slots', () => {
  const pageContext = createPageContext();
  const block = { blockId: 'b1', slots: { content: { blocks: [] } } };
  moveAreasToSlots(block, pageContext);
  expect(block.slots).toEqual({ content: { blocks: [] } });
  expect(pageContext.context.handleWarning).not.toHaveBeenCalled();
});
