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

import validateCssKeys from './validateCssKeys.js';

function createPageContext(blockMetas = {}) {
  return {
    context: {
      handleWarning: jest.fn(),
      blockMetas,
    },
  };
}

test('validateCssKeys does nothing when no block meta found', () => {
  const pageContext = createPageContext();
  const block = { blockId: 'b1', type: 'Unknown', style: { foo: {} } };
  validateCssKeys(block, pageContext);
  expect(pageContext.context.handleWarning).not.toHaveBeenCalled();
});

test('validateCssKeys does nothing when cssKeys is false (opt-out)', () => {
  const pageContext = createPageContext({ Input: { cssKeys: false } });
  const block = { blockId: 'b1', type: 'Input', style: { foo: {} } };
  validateCssKeys(block, pageContext);
  expect(pageContext.context.handleWarning).not.toHaveBeenCalled();
});

test('validateCssKeys does nothing when block has no style or class', () => {
  const pageContext = createPageContext({ Input: { cssKeys: ['element'] } });
  const block = { blockId: 'b1', type: 'Input' };
  validateCssKeys(block, pageContext);
  expect(pageContext.context.handleWarning).not.toHaveBeenCalled();
});

test('validateCssKeys allows "block" key (always valid)', () => {
  const pageContext = createPageContext({ Input: { cssKeys: ['element'] } });
  const block = { blockId: 'b1', type: 'Input', style: { block: { color: 'red' } } };
  validateCssKeys(block, pageContext);
  expect(pageContext.context.handleWarning).not.toHaveBeenCalled();
});

test('validateCssKeys allows keys from block meta cssKeys', () => {
  const pageContext = createPageContext({ Input: { cssKeys: ['element', 'label'] } });
  const block = {
    blockId: 'b1',
    type: 'Input',
    style: { block: {}, element: {}, label: {} },
  };
  validateCssKeys(block, pageContext);
  expect(pageContext.context.handleWarning).not.toHaveBeenCalled();
});

test('validateCssKeys warns on unknown key in style', () => {
  const pageContext = createPageContext({ Input: { cssKeys: ['element'] } });
  const block = {
    blockId: 'b1',
    type: 'Input',
    style: { header: { color: 'blue' } },
  };
  validateCssKeys(block, pageContext);
  expect(pageContext.context.handleWarning).toHaveBeenCalledTimes(1);
  expect(pageContext.context.handleWarning.mock.calls[0][0].message).toContain(
    'Unknown CSS key "--header" in "style"'
  );
  expect(pageContext.context.handleWarning.mock.calls[0][0].message).toContain('--block, --element');
});

test('validateCssKeys warns on unknown key in class', () => {
  const pageContext = createPageContext({ Input: { cssKeys: ['element'] } });
  const block = {
    blockId: 'b1',
    type: 'Input',
    class: { footer: 'text-sm' },
  };
  validateCssKeys(block, pageContext);
  expect(pageContext.context.handleWarning).toHaveBeenCalledTimes(1);
  expect(pageContext.context.handleWarning.mock.calls[0][0].message).toContain(
    'Unknown CSS key "--footer" in "class"'
  );
});

test('validateCssKeys defaults cssKeys to ["element"] when not specified in meta', () => {
  const pageContext = createPageContext({ Box: {} });
  const block = {
    blockId: 'b1',
    type: 'Box',
    style: { element: {}, block: {} },
  };
  validateCssKeys(block, pageContext);
  expect(pageContext.context.handleWarning).not.toHaveBeenCalled();
});

test('validateCssKeys warns on multiple unknown keys', () => {
  const pageContext = createPageContext({ Input: { cssKeys: ['element'] } });
  const block = {
    blockId: 'b1',
    type: 'Input',
    style: { header: {}, footer: {} },
    class: { sidebar: 'p-4' },
  };
  validateCssKeys(block, pageContext);
  expect(pageContext.context.handleWarning).toHaveBeenCalledTimes(3);
});

test('validateCssKeys skips validation when style is an operator expression', () => {
  const pageContext = createPageContext({ Input: { cssKeys: ['element'] } });
  const block = {
    blockId: 'b1',
    type: 'Input',
    style: { _yaml_parse: ['color: red'] },
  };
  validateCssKeys(block, pageContext);
  expect(pageContext.context.handleWarning).not.toHaveBeenCalled();
});

test('validateCssKeys skips validation when class is an operator expression', () => {
  const pageContext = createPageContext({ Input: { cssKeys: ['element'] } });
  const block = {
    blockId: 'b1',
    type: 'Input',
    class: { _if_none: [{ _state: 'block.class' }, null] },
  };
  validateCssKeys(block, pageContext);
  expect(pageContext.context.handleWarning).not.toHaveBeenCalled();
});

test('validateCssKeys ignores tilde metadata keys', () => {
  const pageContext = createPageContext({ Input: { cssKeys: ['element'] } });
  const block = {
    blockId: 'b1',
    type: 'Input',
    style: { block: {}, '~k': 'some.path' },
    class: { element: 'my-class', '~k': 'some.path' },
  };
  validateCssKeys(block, pageContext);
  expect(pageContext.context.handleWarning).not.toHaveBeenCalled();
});
