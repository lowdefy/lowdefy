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

import { type } from '@lowdefy/helpers';

const MAX_VALUES = 5;
const MAX_FIXTURE_VALUES = 2;
const DEFAULT_LONG_LENGTH = 300;
const LONG_PATTERN = 'Explorer long value ';

function fieldOf(blockId) {
  const segments = String(blockId ?? '').split('.');
  return segments[segments.length - 1];
}

function fixtureValues({ fixtures, field, isNumber }) {
  const values = [];
  Object.values(fixtures ?? {}).forEach((documents) => {
    (documents ?? []).forEach((document) => {
      const value = document?.[field];
      const fits = isNumber ? type.isNumber(value) : type.isString(value);
      if (fits && !values.includes(value)) values.push(value);
    });
  });
  return values;
}

function exampleValue({ field, blockId, isNumber, input, walkIndex }) {
  if (isNumber) return input.min ?? 1;
  if (/email/i.test(blockId)) return `explorer.${walkIndex}@example.com`;
  if (/phone/i.test(blockId)) return '+1 555 0100';
  return `Explorer ${field} ${walkIndex}`;
}

// The values a walk may type into a fill candidate, named, at most five: the
// policy picks one as an option, so a model never writes a value. Pure and
// deterministic for a candidate, data set fixtures and walk index.
//   empty    '' when the input is required or validated
//   fixture  up to 2 fixture values of a field named like the block id's last
//            segment (ticket.title -> title)
//   example  "Explorer <field> <walk>", an example address or phone number,
//            or min (else 1) for numbers
//   long     maxLength characters (300 without one); max for numbers
//   invalid  three spaces; min - 1 for numbers with a min
function generateFillValues({ candidate, fixtures, walkIndex }) {
  const input = candidate.input ?? {};
  const blockId = candidate.target?.blockId ?? '';
  const field = fieldOf(blockId);
  const isNumber = input.valueType === 'number';
  const checked = input.required === true || input.hasValidate === true;

  const before = checked ? [{ name: 'empty', value: '' }] : [];
  const after = [
    { name: 'example', value: exampleValue({ field, blockId, isNumber, input, walkIndex }) },
  ];
  if (isNumber) {
    if (type.isNumber(input.max)) after.push({ name: 'long', value: input.max });
    if (checked && type.isNumber(input.min)) after.push({ name: 'invalid', value: input.min - 1 });
  } else {
    const length = input.maxLength ?? DEFAULT_LONG_LENGTH;
    after.push({
      name: 'long',
      value: LONG_PATTERN.repeat(Math.ceil(length / LONG_PATTERN.length)).slice(0, length),
    });
    if (checked) after.push({ name: 'invalid', value: '   ' });
  }
  const room = Math.min(MAX_FIXTURE_VALUES, MAX_VALUES - before.length - after.length);
  const fixture = fixtureValues({ fixtures, field, isNumber })
    .slice(0, Math.max(room, 0))
    .map((value) => ({ name: 'fixture', value }));
  return [...before, ...fixture, ...after];
}

export default generateFillValues;
