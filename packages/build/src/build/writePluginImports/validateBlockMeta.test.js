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
import { ConfigError, ConfigWarning } from '@lowdefy/errors';

import validateBlockMeta from './validateBlockMeta.js';

function createContext() {
  return { errors: [], handleWarning: jest.fn() };
}

function validate(meta, context = createContext()) {
  const valid = validateBlockMeta({
    meta,
    typeName: 'MyBlock',
    packageName: '@acme/blocks',
    context,
  });
  return { valid, context };
}

const validMeta = {
  category: 'input',
  valueType: 'string',
  initValue: '',
  icons: ['AiOutlineEdit'],
  properties: { type: 'object', properties: { title: { type: 'string' } } },
  cssKeys: { element: 'The input element.' },
  slots: { content: 'Child blocks.' },
  methods: { focus: 'Focus the input.' },
  events: {
    onChange: 'Triggered on change.',
    onSelect: { description: 'Triggered on select.', event: { value: 'The selected value.' } },
  },
  hazards: [{ id: 'trims-value', message: 'The value is trimmed.', see: null }],
  dynamicEvents: false,
};

test('validateBlockMeta accepts a complete valid meta without errors or warnings', () => {
  const { valid, context } = validate(validMeta);
  expect(valid).toBe(true);
  expect(context.errors).toEqual([]);
  expect(context.handleWarning).not.toHaveBeenCalled();
});

test('validateBlockMeta accepts the minimal meta of a display block', () => {
  const { valid, context } = validate({ category: 'display', valueType: null });
  expect(valid).toBe(true);
  expect(context.errors).toEqual([]);
});

test('validateBlockMeta reports an absent meta naming the package metas export', () => {
  const { valid, context } = validate(undefined);
  expect(valid).toBe(false);
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0]).toBeInstanceOf(ConfigError);
  expect(context.errors[0].message).toBe(
    'Block type "MyBlock" from package "@acme/blocks": has no meta. Export it from "@acme/blocks/metas" as { MyBlock: meta } with at least { category }.'
  );
});

test('validateBlockMeta reports a meta that is not a plain object', () => {
  const { valid, context } = validate('display');
  expect(valid).toBe(false);
  expect(context.errors[0].message).toContain('meta must be a plain object. Received "display".');
});

test('validateBlockMeta reports a missing category listing the five categories', () => {
  const { valid, context } = validate({ valueType: null });
  expect(valid).toBe(false);
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toContain('meta.category is missing');
  expect(context.errors[0].message).toContain(
    '["display","input","input-container","container","list"]'
  );
});

test('validateBlockMeta reports a bad category with the received value', () => {
  const { valid, context } = validate({ category: 'widget' });
  expect(valid).toBe(false);
  expect(context.errors[0].message).toContain('meta.category must be one of');
  expect(context.errors[0].message).toContain('Received "widget".');
  expect(context.errors[0].received).toBe('widget');
});

test('validateBlockMeta reports a bad valueType with the received value', () => {
  const { valid, context } = validate({ category: 'input', valueType: 'text' });
  expect(valid).toBe(false);
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toContain('meta.valueType must be null or one of');
  expect(context.errors[0].message).toContain('"primitive"');
  expect(context.errors[0].message).toContain('Received "text".');
});

test('validateBlockMeta reports initValue without a valueType', () => {
  const { valid, context } = validate({ category: 'display', valueType: null, initValue: '' });
  expect(valid).toBe(false);
  expect(context.errors[0].message).toContain('meta.initValue requires a meta.valueType');
  expect(context.errors[0].message).toContain('valueType is null');
  expect(context.errors[0].message).toContain('Received initValue "".');
});

test('validateBlockMeta reports icons that are not an array of strings', () => {
  const { valid, context } = validate({ category: 'display', icons: 'AiOutlineEdit' });
  expect(valid).toBe(false);
  expect(context.errors[0].message).toContain(
    'meta.icons must be an array of strings. Received "AiOutlineEdit".'
  );
});

test('validateBlockMeta reports properties that are not an object', () => {
  const { valid, context } = validate({ category: 'display', properties: ['title'] });
  expect(valid).toBe(false);
  expect(context.errors[0].message).toContain(
    'meta.properties must be a JSON Schema object. Received ["title"].'
  );
});

test('validateBlockMeta reports cssKeys, slots and methods that are not objects of strings', () => {
  const { valid, context } = validate({
    category: 'container',
    cssKeys: ['element'],
    slots: { content: { description: 'Child blocks.' } },
    methods: 'focus',
  });
  expect(valid).toBe(false);
  const messages = context.errors.map((e) => e.message);
  expect(messages).toHaveLength(3);
  expect(messages[0]).toContain('meta.slots must be an object of { name: description } strings');
  expect(messages[0]).toContain('Received {"content":{"description":"Child blocks."}}.');
  expect(messages[1]).toContain(
    'meta.cssKeys must be an object of { name: description } strings. Received ["element"].'
  );
  expect(messages[2]).toContain('meta.methods must be an object of { name: description } strings.');
});

test('validateBlockMeta accepts slots: false for dynamic slots and an array of slot names', () => {
  expect(validate({ category: 'container', slots: false }).valid).toBe(true);
  expect(validate({ category: 'container', slots: ['content', 'footer'] }).valid).toBe(true);
});

test('validateBlockMeta reports a non-object events value', () => {
  const { valid, context } = validate({ category: 'display', events: ['onClick'] });
  expect(valid).toBe(false);
  expect(context.errors[0].message).toContain('meta.events must be an object of');
  expect(context.errors[0].message).toContain('Received ["onClick"].');
});

test('validateBlockMeta reports an event definition that is neither a string nor { description, event }', () => {
  const { valid, context } = validate({
    category: 'display',
    events: { onClick: 'Fine.', onSelect: { event: { value: 'x' } }, onBlur: 42 },
  });
  expect(valid).toBe(false);
  expect(context.errors).toHaveLength(2);
  expect(context.errors[0].message).toContain('meta.events.onSelect must be a description string');
  expect(context.errors[0].message).toContain('Received {"event":{"value":"x"}}.');
  expect(context.errors[1].message).toContain('meta.events.onBlur must be a description string');
  expect(context.errors[1].message).toContain('Received 42.');
});

test('validateBlockMeta reports malformed hazards and dynamicEvents', () => {
  const { valid, context } = validate({
    category: 'display',
    hazards: [{ id: 'x' }],
    dynamicEvents: 'yes',
  });
  expect(valid).toBe(false);
  expect(context.errors).toHaveLength(2);
  expect(context.errors[0].message).toContain(
    'meta.dynamicEvents must be a boolean. Received "yes".'
  );
  expect(context.errors[1].message).toContain('meta.hazards must be an array of');
  expect(context.errors[1].message).toContain('Received [{"id":"x"}].');
});

test('validateBlockMeta warns rather than errors on an unknown key and keeps the meta valid', () => {
  const { valid, context } = validate({ category: 'display', valueType: null, styles: ['a.css'] });
  expect(valid).toBe(true);
  expect(context.errors).toEqual([]);
  expect(context.handleWarning).toHaveBeenCalledTimes(1);
  const warning = context.handleWarning.mock.calls[0][0];
  expect(warning).toBeInstanceOf(ConfigWarning);
  expect(warning.message).toContain('meta has unknown keys ["styles"]');
  expect(warning.message).toContain('Known keys are ["category","cssKeys"');
  expect(warning.received).toEqual(['styles']);
});

test('validateBlockMeta collects every bad field of one meta instead of stopping at the first', () => {
  const { valid, context } = validate({
    category: 'widget',
    valueType: 'text',
    icons: 'x',
    events: 'onClick',
  });
  expect(valid).toBe(false);
  expect(context.errors).toHaveLength(4);
});

test('validateBlockMeta throws immediately when the context has no error collection', () => {
  expect(() => validate({ category: 'widget' }, { handleWarning: jest.fn() })).toThrow(ConfigError);
});
