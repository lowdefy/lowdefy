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

import buildDynamicBlock from './buildDynamicBlock.js';
import createCounter from '../../../utils/createCounter.js';

function makePageContext() {
  return {
    pageId: 'page1',
    dynamicBlockRefs: [],
    typeCounters: {
      blocks: createCounter(),
      actions: createCounter(),
      operators: {
        client: createCounter(),
        server: createCounter(),
      },
    },
  };
}

test('buildDynamicBlock ignores non-Dynamic blocks', () => {
  const pageContext = makePageContext();
  const block = { blockId: 'box_1', type: 'Box' };
  buildDynamicBlock(block, pageContext);
  expect(pageContext.hasDynamicBlocks).toBe(undefined);
  expect(pageContext.dynamicBlockRefs).toEqual([]);
});

test('buildDynamicBlock collects ref and sets hasDynamicBlocks for a valid block', () => {
  const pageContext = makePageContext();
  const block = {
    blockId: 'section_1',
    type: 'Dynamic',
    properties: { endpointId: 'resolve_section', params: { area: 'insights' } },
  };
  buildDynamicBlock(block, pageContext);
  expect(pageContext.hasDynamicBlocks).toBe(true);
  expect(pageContext.dynamicBlockRefs).toEqual([
    { endpointId: 'resolve_section', block, sourcePageId: 'page1' },
  ]);
});

test('buildDynamicBlock throws when properties is missing', () => {
  const pageContext = makePageContext();
  const block = { blockId: 'section_1', type: 'Dynamic' };
  expect(() => buildDynamicBlock(block, pageContext)).toThrow(
    'Dynamic block "section_1" on page "page1" properties should be an object.'
  );
});

test('buildDynamicBlock throws when endpointId is missing', () => {
  const pageContext = makePageContext();
  const block = { blockId: 'section_1', type: 'Dynamic', properties: {} };
  expect(() => buildDynamicBlock(block, pageContext)).toThrow(
    'Dynamic block "section_1" on page "page1" requires properties.endpointId.'
  );
});

test('buildDynamicBlock throws when endpointId is not a string', () => {
  const pageContext = makePageContext();
  const block = { blockId: 'section_1', type: 'Dynamic', properties: { endpointId: 7 } };
  expect(() => buildDynamicBlock(block, pageContext)).toThrow(
    'Dynamic block "section_1" on page "page1" properties.endpointId is not a string.'
  );
});

test('buildDynamicBlock throws when params is not an object', () => {
  const pageContext = makePageContext();
  const block = {
    blockId: 'section_1',
    type: 'Dynamic',
    properties: { endpointId: 'resolve_section', params: ['a'] },
  };
  expect(() => buildDynamicBlock(block, pageContext)).toThrow(
    'Dynamic block "section_1" on page "page1" properties.params should be an object.'
  );
});

test('buildDynamicBlock throws when params contains an operator', () => {
  const pageContext = makePageContext();
  const block = {
    blockId: 'section_1',
    type: 'Dynamic',
    properties: {
      endpointId: 'resolve_section',
      params: { area: { _state: 'selected_area' } },
    },
  };
  expect(() => buildDynamicBlock(block, pageContext)).toThrow(
    'Dynamic block "section_1" on page "page1" properties.params must not contain operators. Found "_state".'
  );
});

test('buildDynamicBlock throws when params contains a nested operator', () => {
  const pageContext = makePageContext();
  const block = {
    blockId: 'section_1',
    type: 'Dynamic',
    properties: {
      endpointId: 'resolve_section',
      params: { filter: { deep: { _user: 'id' } } },
    },
  };
  expect(() => buildDynamicBlock(block, pageContext)).toThrow(
    'Dynamic block "section_1" on page "page1" properties.params must not contain operators. Found "_user".'
  );
});

test('buildDynamicBlock throws when required is not a boolean', () => {
  const pageContext = makePageContext();
  const block = {
    blockId: 'section_1',
    type: 'Dynamic',
    properties: { endpointId: 'resolve_section', required: 'yes' },
  };
  expect(() => buildDynamicBlock(block, pageContext)).toThrow(
    'Dynamic block "section_1" on page "page1" properties.required is not a boolean.'
  );
});

test('buildDynamicBlock counts declared types into type counters', () => {
  const pageContext = makePageContext();
  const block = {
    blockId: 'section_1',
    type: 'Dynamic',
    properties: {
      endpointId: 'resolve_section',
      types: {
        blocks: ['Statistic', 'AgGridAlpine'],
        actions: ['CopyToClipboard'],
        operators: ['_number', '_string.concat'],
      },
    },
  };
  buildDynamicBlock(block, pageContext);
  expect(pageContext.typeCounters.blocks.getCounts()).toEqual({
    Statistic: 1,
    AgGridAlpine: 1,
  });
  expect(pageContext.typeCounters.actions.getCounts()).toEqual({ CopyToClipboard: 1 });
  // Method form normalizes to the base operator.
  expect(pageContext.typeCounters.operators.client.getCounts()).toEqual({
    _number: 1,
    _string: 1,
  });
});

test('buildDynamicBlock throws on unknown types category', () => {
  const pageContext = makePageContext();
  const block = {
    blockId: 'section_1',
    type: 'Dynamic',
    properties: {
      endpointId: 'resolve_section',
      types: { requests: ['MongoDBFind'] },
    },
  };
  expect(() => buildDynamicBlock(block, pageContext)).toThrow(
    'Dynamic block "section_1" on page "page1" properties.types has unknown category "requests". Valid categories: blocks, actions, operators.'
  );
});

test('buildDynamicBlock throws when types category is not an array', () => {
  const pageContext = makePageContext();
  const block = {
    blockId: 'section_1',
    type: 'Dynamic',
    properties: {
      endpointId: 'resolve_section',
      types: { blocks: 'Statistic' },
    },
  };
  expect(() => buildDynamicBlock(block, pageContext)).toThrow(
    'Dynamic block "section_1" on page "page1" properties.types.blocks should be an array.'
  );
});

test('buildDynamicBlock throws when declared operator name does not start with underscore', () => {
  const pageContext = makePageContext();
  const block = {
    blockId: 'section_1',
    type: 'Dynamic',
    properties: {
      endpointId: 'resolve_section',
      types: { operators: ['number'] },
    },
  };
  expect(() => buildDynamicBlock(block, pageContext)).toThrow(
    'Dynamic block "section_1" on page "page1" properties.types.operators contains "number" which is not an operator name.'
  );
});
