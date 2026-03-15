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

import Ajv from 'ajv';
import buildBlockSchema from './buildBlockSchema.js';

const ajv = new Ajv({ strict: false });

function validate(meta, data) {
  const schema = buildBlockSchema(meta);
  const valid = ajv.validate(schema, data);
  return { valid, errors: ajv.errors };
}

test('basic display block with cssKeys and events', () => {
  const meta = {
    category: 'display',
    cssKeys: {
      element: 'The button element.',
      icon: 'The icon inside the button.',
    },
    events: {
      onClick: 'Trigger actions when clicked.',
    },
    properties: {
      type: 'object',
      additionalProperties: false,
      properties: {
        title: { type: 'string' },
      },
    },
  };
  const schema = buildBlockSchema(meta);
  expect(schema.properties.class).toBeDefined();
  expect(schema.properties.style).toBeDefined();
  expect(schema.properties.events).toBeDefined();
  expect(schema.properties.blocks).toBeUndefined();
  expect(schema.properties.areas).toBeUndefined();
});

test('container block includes blocks and areas', () => {
  const meta = { category: 'container' };
  const schema = buildBlockSchema(meta);
  expect(schema.properties.blocks).toEqual({ type: 'array', items: { type: 'object' } });
  expect(schema.properties.areas).toEqual({ type: 'object' });
});

test('no cssKeys produces only --block in class/style properties', () => {
  const meta = { category: 'display' };
  const schema = buildBlockSchema(meta);
  const classObj = schema.properties.class.oneOf[3];
  expect(Object.keys(classObj.properties)).toEqual(['--block']);
  const styleObj = schema.properties.style.oneOf[1];
  expect(Object.keys(styleObj.properties)).toEqual(['--block']);
});

test('no events produces empty event properties', () => {
  const meta = { category: 'display' };
  const schema = buildBlockSchema(meta);
  const eventObj = schema.properties.events.oneOf[1];
  expect(eventObj.properties).toEqual({});
});

test('class: string passes', () => {
  const { valid } = validate(
    { category: 'display' },
    { id: 'b1', type: 'Box', class: 'my-class' }
  );
  expect(valid).toBe(true);
});

test('class: array passes', () => {
  const { valid } = validate(
    { category: 'display' },
    { id: 'b1', type: 'Box', class: ['a', 'b'] }
  );
  expect(valid).toBe(true);
});

test('class: object with --block key passes', () => {
  const { valid } = validate(
    { category: 'display' },
    { id: 'b1', type: 'Box', class: { '--block': 'a' } }
  );
  expect(valid).toBe(true);
});

test('class: object with unknown --key fails', () => {
  const { valid } = validate(
    { category: 'display' },
    { id: 'b1', type: 'Box', class: { '--unknown': 'a' } }
  );
  expect(valid).toBe(false);
});

test('class: operator passes', () => {
  const { valid } = validate(
    { category: 'display' },
    { id: 'b1', type: 'Box', class: { _if: {} } }
  );
  expect(valid).toBe(true);
});

test('style: operator passes', () => {
  const { valid } = validate(
    { category: 'display' },
    { id: 'b1', type: 'Box', style: { _if: {} } }
  );
  expect(valid).toBe(true);
});

test('style: --block keyed object passes', () => {
  const { valid } = validate(
    { category: 'display' },
    { id: 'b1', type: 'Box', style: { '--block': { marginTop: 20 } } }
  );
  expect(valid).toBe(true);
});

test('style: flat CSS object passes', () => {
  const { valid } = validate(
    { category: 'display' },
    { id: 'b1', type: 'Box', style: { marginTop: 20 } }
  );
  expect(valid).toBe(true);
});

test('style: unknown --key fails', () => {
  const { valid } = validate(
    { category: 'display' },
    { id: 'b1', type: 'Box', style: { '--unknown': {} } }
  );
  expect(valid).toBe(false);
});

test('style: empty object matches keyed-style', () => {
  const { valid } = validate(
    { category: 'display' },
    { id: 'b1', type: 'Box', style: {} }
  );
  expect(valid).toBe(true);
});

test('events: known event passes', () => {
  const meta = {
    category: 'display',
    events: { onClick: 'Clicked.' },
  };
  const { valid } = validate(meta, { id: 'b1', type: 'Box', events: { onClick: [] } });
  expect(valid).toBe(true);
});

test('events: operator passes', () => {
  const { valid } = validate(
    { category: 'display', events: { onClick: 'Clicked.' } },
    { id: 'b1', type: 'Box', events: { _if: {} } }
  );
  expect(valid).toBe(true);
});

test('events: unknown event fails', () => {
  const meta = {
    category: 'display',
    events: { onClick: 'Clicked.' },
  };
  const { valid } = validate(meta, { id: 'b1', type: 'Box', events: { unknownEvent: [] } });
  expect(valid).toBe(false);
});

test('operator schema: single _key passes', () => {
  const { valid } = validate(
    { category: 'display' },
    { id: 'b1', type: 'Box', visible: { _if: {} } }
  );
  expect(valid).toBe(true);
});

test('operator schema: multiple _keys fails (maxProperties)', () => {
  const { valid } = validate(
    { category: 'display' },
    { id: 'b1', type: 'Box', visible: { _a: 1, _b: 2 } }
  );
  expect(valid).toBe(false);
});

test('operator schema: non-underscore key fails', () => {
  const { valid } = validate(
    { category: 'display' },
    { id: 'b1', type: 'Box', visible: { foo: 1 } }
  );
  expect(valid).toBe(false);
});

test('properties passthrough: meta.properties schema used directly', () => {
  const meta = {
    category: 'display',
    properties: {
      type: 'object',
      additionalProperties: false,
      properties: {
        title: { type: 'string' },
      },
    },
  };
  const schema = buildBlockSchema(meta);
  expect(schema.properties.properties).toEqual(meta.properties);
});

test('required fields id and type', () => {
  const { valid } = validate({ category: 'display' }, { type: 'Box' });
  expect(valid).toBe(false);
  const r2 = validate({ category: 'display' }, { id: 'b1' });
  expect(r2.valid).toBe(false);
  const r3 = validate({ category: 'display' }, { id: 'b1', type: 'Box' });
  expect(r3.valid).toBe(true);
});
