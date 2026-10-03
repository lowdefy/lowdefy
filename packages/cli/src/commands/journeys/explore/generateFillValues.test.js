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

import generateFillValues from './generateFillValues.js';

function fill(blockId, input) {
  return { kind: 'fill', target: { blockId }, input };
}

const fixtures = {
  tickets: [
    { title: 'Printer on fire' },
    { title: 'Printer on fire' },
    { title: 'Desk wobbles' },
    { title: 'Third' },
  ],
  users: [{ title: 'Lead' }, { count: 4 }],
};

test('generateFillValues gives empty, fixtures, example, long and invalid for a required string', () => {
  expect(
    generateFillValues({
      candidate: fill('ticket.title', { valueType: 'string', required: true, maxLength: 12 }),
      fixtures,
      walkIndex: 2,
    })
  ).toEqual([
    { name: 'empty', value: '' },
    { name: 'fixture', value: 'Printer on fire' },
    { name: 'example', value: 'Explorer title 2' },
    { name: 'long', value: 'Explorer lon' },
    { name: 'invalid', value: '   ' },
  ]);
});

test('generateFillValues gives two fixtures and a 300 character long value for an optional string', () => {
  const values = generateFillValues({
    candidate: fill('title', { valueType: 'string', required: false, hasValidate: false }),
    fixtures,
    walkIndex: 0,
  });
  expect(values.map((value) => value.name)).toEqual(['fixture', 'fixture', 'example', 'long']);
  expect(values[0].value).toEqual('Printer on fire');
  expect(values[1].value).toEqual('Desk wobbles');
  expect(values[3].value).toHaveLength(300);
});

test('generateFillValues gives an example address and phone number by block id', () => {
  expect(
    generateFillValues({
      candidate: fill('contact_email', { valueType: 'string' }),
      fixtures: {},
      walkIndex: 3,
    })[0]
  ).toEqual({ name: 'example', value: 'explorer.3@example.com' });
  expect(
    generateFillValues({
      candidate: fill('mobilePhone', { valueType: 'string' }),
      fixtures: {},
      walkIndex: 3,
    })[0]
  ).toEqual({ name: 'example', value: '+1 555 0100' });
});

test('generateFillValues gives numbers from min and max', () => {
  expect(
    generateFillValues({
      candidate: fill('count', { valueType: 'number', hasValidate: true, min: 2, max: 9 }),
      fixtures,
      walkIndex: 0,
    })
  ).toEqual([
    { name: 'empty', value: '' },
    { name: 'fixture', value: 4 },
    { name: 'example', value: 2 },
    { name: 'long', value: 9 },
    { name: 'invalid', value: 1 },
  ]);
  expect(
    generateFillValues({
      candidate: fill('count', { valueType: 'number' }),
      fixtures: null,
      walkIndex: 0,
    })
  ).toEqual([{ name: 'example', value: 1 }]);
});
