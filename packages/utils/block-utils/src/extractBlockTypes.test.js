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

import extractBlockTypes from './extractBlockTypes.js';

test('extractBlockTypes returns the block type names', () => {
  const { blocks } = extractBlockTypes({
    Button: { category: 'display' },
    TextInput: { category: 'input' },
  });
  expect(blocks).toEqual(['Button', 'TextInput']);
});

test('extractBlockTypes defaults icons to an empty array', () => {
  const { icons } = extractBlockTypes({
    Button: { category: 'display', icons: ['AiOutlineCheck'] },
    Box: { category: 'container' },
  });
  expect(icons).toEqual({ Button: ['AiOutlineCheck'], Box: [] });
});

test('extractBlockTypes carries category, valueType, initValue, slots and cssKeys', () => {
  const { blockMetas } = extractBlockTypes({
    Selector: {
      category: 'input',
      valueType: 'string',
      initValue: null,
      slots: { label: {} },
      cssKeys: { element: 'The element.', label: 'The label.' },
    },
  });
  expect(blockMetas.Selector).toEqual({
    category: 'input',
    valueType: 'string',
    initValue: null,
    slots: { label: {} },
    cssKeys: ['element', 'label'],
  });
});

test('extractBlockTypes maps string-form events to empty entries', () => {
  const { blockMetas } = extractBlockTypes({
    Button: {
      category: 'display',
      events: {
        onClick: 'Trigger action when the button is clicked.',
        onDoubleClick: 'Trigger action when the button is double clicked.',
      },
    },
  });
  expect(blockMetas.Button.events).toEqual({ onClick: {}, onDoubleClick: {} });
});

test('extractBlockTypes carries a declared payload schema and drops the description', () => {
  const payload = {
    type: 'object',
    additionalProperties: false,
    properties: { value: { type: 'string', description: 'The current input value.' } },
  };
  const { blockMetas } = extractBlockTypes({
    TextInput: {
      category: 'input',
      events: {
        onChange: { description: 'Trigger action when the input value changes.', payload },
        onBlur: 'Trigger action when the input loses focus.',
      },
    },
  });
  expect(blockMetas.TextInput.events).toEqual({ onChange: { payload }, onBlur: {} });
  expect(JSON.stringify(blockMetas.TextInput.events)).not.toContain(
    'Trigger action when the input value changes.'
  );
});

test('extractBlockTypes normalises the legacy event map to a description-only payload', () => {
  const { blockMetas } = extractBlockTypes({
    Selector: {
      category: 'input',
      events: {
        onChange: {
          description: 'Trigger action when selection is changed.',
          event: { value: 'The selected value.' },
        },
      },
    },
  });
  expect(blockMetas.Selector.events).toEqual({
    onChange: {
      payload: {
        type: 'object',
        properties: { value: { description: 'The selected value.' } },
      },
    },
  });
});

test('extractBlockTypes treats an object event without payload or event map as having no payload', () => {
  const { blockMetas } = extractBlockTypes({
    Upload: {
      category: 'input',
      events: { onChange: { description: 'Triggered when the upload state is changing.' } },
    },
  });
  expect(blockMetas.Upload.events).toEqual({ onChange: {} });
});

test('extractBlockTypes omits events when the meta declares none', () => {
  const { blockMetas } = extractBlockTypes({
    AgGridAlpine: { category: 'display' },
  });
  expect(blockMetas.AgGridAlpine).toEqual({ category: 'display' });
  expect('events' in blockMetas.AgGridAlpine).toBe(false);
});

test('extractBlockTypes carries dynamicEvents when the meta declares it', () => {
  const { blockMetas } = extractBlockTypes({
    Tabs: { category: 'container', dynamicEvents: true, events: { onChange: 'On change.' } },
    Button: { category: 'display', events: { onClick: 'On click.' } },
  });
  expect(blockMetas.Tabs.dynamicEvents).toBe(true);
  expect('dynamicEvents' in blockMetas.Button).toBe(false);
});
