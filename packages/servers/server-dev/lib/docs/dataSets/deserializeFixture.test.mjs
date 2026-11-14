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

import { Decimal128, ObjectId } from 'mongodb';
import { expect, test } from 'vitest';

import deserializeFixture from './deserializeFixture.js';

test('deserializeFixture revives dates, ObjectIds and decimals at any depth', () => {
  const document = deserializeFixture({
    _id: { _oid: '64b7f0c2a1b2c3d4e5f60718' },
    issued: { '~d': '2026-01-02T00:00:00.000Z' },
    total: { _decimal: '1234567890123456789012345678.901234' },
    lines: [{ quantity: { _decimal: '-0.250' } }, { quantity: { _decimal: '0' } }],
    note: 'plain',
  });
  expect(document._id).toEqual(ObjectId.createFromHexString('64b7f0c2a1b2c3d4e5f60718'));
  expect(document.issued).toEqual(new Date('2026-01-02T00:00:00.000Z'));
  expect(document.total).toBeInstanceOf(Decimal128);
  expect(document.total.toString()).toEqual('1234567890123456789012345678.901234');
  expect(document.lines[0].quantity.toString()).toEqual('-0.250');
  expect(document.lines[1].quantity.toString()).toEqual('0');
  expect(document.note).toEqual('plain');
});

test('deserializeFixture refuses a decimal written as a number', () => {
  expect(() => deserializeFixture({ total: { _decimal: 12.5 } })).toThrow(
    "A fixture decimal is a string, such as { _decimal: '12.50' }. Received 12.5."
  );
});
