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

import applyTextThreshold from './applyTextThreshold.js';
import traceRecord from './traceRecord.js';

function clicks({ persons, orgs, text = 'Assign', source = 'production' }) {
  return persons.map((person, index) =>
    traceRecord({
      at: index,
      block: 'grid',
      row: index,
      text,
      nth: 0,
      source,
      session: `s-${index}`,
      person,
      org: orgs[index] ?? null,
    })
  );
}

function texts(records) {
  return records.map((record) => record.target.text);
}

test('applyTextThreshold keeps text clicked by 5 persons in 2 orgs', () => {
  const records = clicks({
    persons: ['p1', 'p2', 'p3', 'p4', 'p5'],
    orgs: ['o1', 'o1', 'o1', 'o2', 'o2'],
  });
  expect(texts(applyTextThreshold({ records }))).toEqual(Array(5).fill('Assign'));
});

test('applyTextThreshold drops text clicked by 4 persons, keeping block, row and column', () => {
  const records = clicks({ persons: ['p1', 'p2', 'p3', 'p4', 'p4'], orgs: ['o1', 'o2'] });
  const result = applyTextThreshold({ records });
  expect(texts(result)).toEqual(Array(5).fill(null));
  expect(result[2].target).toMatchObject({ block_id: 'grid', row: 2, nth: null, text: null });
});

test('applyTextThreshold drops text from 5 persons in 1 org when the window holds 2 orgs', () => {
  const records = [
    ...clicks({ persons: ['p1', 'p2', 'p3', 'p4', 'p5'], orgs: Array(5).fill('o1') }),
    traceRecord({ at: 9, block: 'other', source: 'production', person: 'p9', org: 'o2' }),
  ];
  expect(texts(applyTextThreshold({ records })).slice(0, 5)).toEqual(Array(5).fill(null));
});

test('applyTextThreshold keeps text from 5 persons in 1 org when the window has 1 org', () => {
  const records = clicks({ persons: ['p1', 'p2', 'p3', 'p4', 'p5'], orgs: Array(5).fill('o1') });
  expect(texts(applyTextThreshold({ records }))).toEqual(Array(5).fill('Assign'));
});

test('applyTextThreshold counts a window with no orgs as one org', () => {
  const records = clicks({ persons: ['p1', 'p2', 'p3', 'p4', 'p5'], orgs: [] });
  expect(texts(applyTextThreshold({ records }))).toEqual(Array(5).fill('Assign'));
});

test('applyTextThreshold never thresholds dev records', () => {
  const records = clicks({ persons: [null], orgs: [], source: 'dev' });
  expect(applyTextThreshold({ records })).toEqual(records);
});

test('applyTextThreshold drops nth together with text', () => {
  const [record] = applyTextThreshold({ records: clicks({ persons: ['p1'], orgs: [] }) });
  expect(record.target.nth).toBeNull();
});
