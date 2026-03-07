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

import normalizeLayout from './normalizeLayout.js';

function createPageContext() {
  return {
    context: {
      handleWarning: jest.fn(),
    },
  };
}

test('normalizeLayout does nothing when no layout', () => {
  const pageContext = createPageContext();
  const block = { blockId: 'b1' };
  normalizeLayout(block, pageContext);
  expect(pageContext.context.handleWarning).not.toHaveBeenCalled();
});

test('normalizeLayout does nothing when layout has no deprecated keys', () => {
  const pageContext = createPageContext();
  const block = { blockId: 'b1', layout: { span: 12, gap: 16 } };
  normalizeLayout(block, pageContext);
  expect(pageContext.context.handleWarning).not.toHaveBeenCalled();
  expect(block.layout).toEqual({ span: 12, gap: 16 });
});

test('normalizeLayout renames contentGutter to gap and warns', () => {
  const pageContext = createPageContext();
  const block = { blockId: 'b1', layout: { contentGutter: 16 } };
  normalizeLayout(block, pageContext);
  expect(block.layout).toEqual({ gap: 16 });
  expect(pageContext.context.handleWarning).toHaveBeenCalledTimes(1);
  expect(pageContext.context.handleWarning.mock.calls[0][0].message).toContain(
    'layout.contentGutter is deprecated'
  );
  expect(pageContext.context.handleWarning.mock.calls[0][0].message).toContain('layout.gap');
});

test('normalizeLayout renames contentGap to gap and warns', () => {
  const pageContext = createPageContext();
  const block = { blockId: 'b1', layout: { contentGap: 16 } };
  normalizeLayout(block, pageContext);
  expect(block.layout).toEqual({ gap: 16 });
  expect(pageContext.context.handleWarning).toHaveBeenCalledTimes(1);
  expect(pageContext.context.handleWarning.mock.calls[0][0].message).toContain(
    'layout.contentGap is deprecated'
  );
});

test('normalizeLayout renames contentJustify to justify and warns', () => {
  const pageContext = createPageContext();
  const block = { blockId: 'b1', layout: { contentJustify: 'center' } };
  normalizeLayout(block, pageContext);
  expect(block.layout).toEqual({ justify: 'center' });
  expect(pageContext.context.handleWarning).toHaveBeenCalledTimes(1);
  expect(pageContext.context.handleWarning.mock.calls[0][0].message).toContain(
    'layout.contentJustify is deprecated'
  );
});

test('normalizeLayout renames contentDirection to direction and warns', () => {
  const pageContext = createPageContext();
  const block = { blockId: 'b1', layout: { contentDirection: 'column' } };
  normalizeLayout(block, pageContext);
  expect(block.layout).toEqual({ direction: 'column' });
  expect(pageContext.context.handleWarning).toHaveBeenCalledTimes(1);
});

test('normalizeLayout renames contentWrap to wrap and warns', () => {
  const pageContext = createPageContext();
  const block = { blockId: 'b1', layout: { contentWrap: 'nowrap' } };
  normalizeLayout(block, pageContext);
  expect(block.layout).toEqual({ wrap: 'nowrap' });
  expect(pageContext.context.handleWarning).toHaveBeenCalledTimes(1);
});

test('normalizeLayout renames contentOverflow to overflow and warns', () => {
  const pageContext = createPageContext();
  const block = { blockId: 'b1', layout: { contentOverflow: 'auto' } };
  normalizeLayout(block, pageContext);
  expect(block.layout).toEqual({ overflow: 'auto' });
  expect(pageContext.context.handleWarning).toHaveBeenCalledTimes(1);
});

test('normalizeLayout does not overwrite existing new key with deprecated value', () => {
  const pageContext = createPageContext();
  const block = { blockId: 'b1', layout: { gap: 8, contentGutter: 16 } };
  normalizeLayout(block, pageContext);
  expect(block.layout).toEqual({ gap: 8 });
  expect(pageContext.context.handleWarning).toHaveBeenCalledTimes(1);
});

test('normalizeLayout renames layout.align to selfAlign and warns', () => {
  const pageContext = createPageContext();
  const block = { blockId: 'b1', layout: { align: 'center' } };
  normalizeLayout(block, pageContext);
  expect(block.layout).toEqual({ selfAlign: 'center' });
  expect(pageContext.context.handleWarning).toHaveBeenCalledTimes(1);
  expect(pageContext.context.handleWarning.mock.calls[0][0].message).toContain(
    'layout.align for self-alignment is deprecated'
  );
  expect(pageContext.context.handleWarning.mock.calls[0][0].message).toContain('layout.selfAlign');
});

test('normalizeLayout does not rename align when selfAlign already set', () => {
  const pageContext = createPageContext();
  const block = { blockId: 'b1', layout: { align: 'center', selfAlign: 'top' } };
  normalizeLayout(block, pageContext);
  expect(block.layout).toEqual({ align: 'center', selfAlign: 'top' });
  expect(pageContext.context.handleWarning).not.toHaveBeenCalled();
});

test('normalizeLayout renames areas.*.gutter to gap and warns', () => {
  const pageContext = createPageContext();
  const block = {
    blockId: 'b1',
    layout: {},
    areas: { content: { gutter: 16 } },
  };
  normalizeLayout(block, pageContext);
  expect(block.areas.content).toEqual({ gap: 16 });
  expect(pageContext.context.handleWarning).toHaveBeenCalledTimes(1);
  expect(pageContext.context.handleWarning.mock.calls[0][0].message).toContain(
    'areas.*.gutter is deprecated'
  );
});

test('normalizeLayout renames slots.*.gutter to gap and warns', () => {
  const pageContext = createPageContext();
  const block = {
    blockId: 'b1',
    layout: {},
    slots: { header: { gutter: 8 } },
  };
  normalizeLayout(block, pageContext);
  expect(block.slots.header).toEqual({ gap: 8 });
  expect(pageContext.context.handleWarning).toHaveBeenCalledTimes(1);
  expect(pageContext.context.handleWarning.mock.calls[0][0].message).toContain(
    'slots.*.gutter is deprecated'
  );
});

test('normalizeLayout does not overwrite existing slot gap with gutter', () => {
  const pageContext = createPageContext();
  const block = {
    blockId: 'b1',
    layout: {},
    slots: { content: { gutter: 16, gap: 8 } },
  };
  normalizeLayout(block, pageContext);
  expect(block.slots.content).toEqual({ gap: 8 });
  expect(pageContext.context.handleWarning).toHaveBeenCalledTimes(1);
});

test('normalizeLayout handles multiple deprecated keys at once', () => {
  const pageContext = createPageContext();
  const block = {
    blockId: 'b1',
    layout: {
      contentGutter: 16,
      contentJustify: 'end',
      contentDirection: 'column',
    },
  };
  normalizeLayout(block, pageContext);
  expect(block.layout).toEqual({ gap: 16, justify: 'end', direction: 'column' });
  expect(pageContext.context.handleWarning).toHaveBeenCalledTimes(3);
});

test('normalizeLayout warnings have prodError true', () => {
  const pageContext = createPageContext();
  const block = { blockId: 'b1', layout: { contentGutter: 16 } };
  normalizeLayout(block, pageContext);
  expect(pageContext.context.handleWarning.mock.calls[0][0].prodError).toBe(true);
});
