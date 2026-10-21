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

import describeCondition from './describeCondition.js';

const fields = {
  name: { title: 'Name', type: 'text' },
  warmth: {
    title: 'Warmth',
    type: 'status',
    options: [
      { value: 'hot', label: 'Hot' },
      { value: 'warm', label: 'Warm' },
      { value: 'cold', label: 'Cold' },
    ],
  },
  employees: { title: 'Employees', type: 'number' },
  lastContacted: { title: 'Last contacted', type: 'date' },
  doNotContact: { title: 'Do not contact', type: 'boolean' },
  labels: { title: 'Labels', type: 'tags' },
  owner: { title: 'Owner', type: 'people' },
  photo: { title: 'Photo', type: 'image' },
};

const say = (condition) => describeCondition({ condition, fields });

test('describeCondition reads text operators', () => {
  expect(say({ key: 'name', op: 'contains', value: 'CX' })).toBe('Name contains CX');
  expect(say({ key: 'name', op: 'notContains', value: 'CX' })).toBe('Name does not contain CX');
  expect(say({ key: 'name', op: 'startsWith', value: 'A' })).toBe('Name starts with A');
  expect(say({ key: 'name', op: 'endsWith', value: 'Ltd' })).toBe('Name ends with Ltd');
  expect(say({ key: 'name', op: 'eq', value: 'Acme' })).toBe('Name is Acme');
  expect(say({ key: 'name', op: 'ne', value: 'Acme' })).toBe('Name is not Acme');
  expect(say({ key: 'name', op: 'empty' })).toBe('Name is empty');
  expect(say({ key: 'name', op: 'notEmpty' })).toBe('Name is not empty');
});

test('describeCondition reads option values as their labels', () => {
  expect(say({ key: 'warmth', op: 'in', value: ['hot', 'warm'] })).toBe(
    'Warmth is any of Hot or Warm'
  );
  expect(say({ key: 'warmth', op: 'nin', value: ['hot', 'warm', 'cold'] })).toBe(
    'Warmth is none of Hot, Warm or Cold'
  );
  expect(say({ key: 'warmth', op: 'eq', value: 'cold' })).toBe('Warmth is Cold');
  expect(say({ key: 'warmth', op: 'eq', value: 'lukewarm' })).toBe('Warmth is lukewarm');
});

test('describeCondition reads number operators', () => {
  expect(say({ key: 'employees', op: 'gt', value: 10 })).toBe('Employees greater than 10');
  expect(say({ key: 'employees', op: 'gte', value: 10 })).toBe('Employees at least 10');
  expect(say({ key: 'employees', op: 'lt', value: 10 })).toBe('Employees less than 10');
  expect(say({ key: 'employees', op: 'lte', value: 10 })).toBe('Employees at most 10');
  expect(say({ key: 'employees', op: 'between', value: [10, 50] })).toBe(
    'Employees between 10 and 50'
  );
  expect(say({ key: 'employees', op: 'between', value: [10, null] })).toBe('Employees from 10');
  expect(say({ key: 'employees', op: 'between', value: [null, 50] })).toBe('Employees up to 50');
});

test('describeCondition reads date operators, fixed and relative', () => {
  expect(say({ key: 'lastContacted', op: 'before', value: '2026-03-01' })).toBe(
    'Last contacted before 2026-03-01'
  );
  expect(say({ key: 'lastContacted', op: 'before', value: { last: 3, unit: 'month' } })).toBe(
    'Last contacted before 3 months ago'
  );
  expect(say({ key: 'lastContacted', op: 'after', value: { next: 1, unit: 'week' } })).toBe(
    'Last contacted after 1 week from now'
  );
  expect(say({ key: 'lastContacted', op: 'within', value: { last: 30, unit: 'day' } })).toBe(
    'Last contacted within the last 30 days'
  );
  expect(say({ key: 'lastContacted', op: 'within', value: { next: 1, unit: 'year' } })).toBe(
    'Last contacted within the next year'
  );
  expect(say({ key: 'lastContacted', op: 'between', value: ['2026-01-01', '2026-03-31'] })).toBe(
    'Last contacted between 2026-01-01 and 2026-03-31'
  );
});

test('describeCondition reads boolean, array and other families', () => {
  expect(say({ key: 'doNotContact', op: 'isTrue' })).toBe('Do not contact is true');
  expect(say({ key: 'doNotContact', op: 'isFalse' })).toBe('Do not contact is false');
  expect(say({ key: 'labels', op: 'contains', value: 'convention-2026' })).toBe(
    'Labels has convention-2026'
  );
  expect(say({ key: 'labels', op: 'in', value: ['a', 'b'] })).toBe('Labels has any of a or b');
  expect(say({ key: 'labels', op: 'notContains', value: 'a' })).toBe('Labels does not have a');
  expect(say({ key: 'photo', op: 'notEmpty' })).toBe('Photo is not empty');
});

test('describeCondition reads $user values as me', () => {
  expect(say({ key: 'owner', op: 'contains', value: { $user: 'id' } })).toBe('Owner has me');
  expect(say({ key: 'owner', op: 'in', value: [{ $user: 'id' }, 'u2'] })).toBe(
    'Owner has any of me or u2'
  );
  expect(say({ key: 'name', op: 'eq', value: { $user: 'profile.name' } })).toBe(
    'Name is my profile.name'
  );
});

test('describeCondition joins groups with and and or, bracketed past the first level', () => {
  expect(
    say({
      and: [
        { key: 'warmth', op: 'in', value: ['hot', 'warm'] },
        { key: 'name', op: 'contains', value: 'CX' },
      ],
    })
  ).toBe('Warmth is any of Hot or Warm and Name contains CX');
  expect(
    say({
      or: [
        { key: 'doNotContact', op: 'isTrue' },
        {
          and: [
            { key: 'lastContacted', op: 'before', value: { last: 3, unit: 'month' } },
            {
              or: [
                { key: 'employees', op: 'gt', value: 50 },
                { key: 'labels', op: 'empty' },
              ],
            },
          ],
        },
      ],
    })
  ).toBe(
    'Do not contact is true or (Last contacted before 3 months ago and (Employees greater than 50 or Labels is empty))'
  );
  // A group of one reads as its only condition; empty groups say nothing.
  expect(say({ and: [{ or: [{ key: 'name', op: 'empty' }] }] })).toBe('Name is empty');
  expect(say({ and: [] })).toBe(null);
  expect(say({ and: [{ or: [] }, { key: 'name', op: 'empty' }] })).toBe('Name is empty');
  expect(say(null)).toBe(null);
});

test('describeCondition describes a key that names no field, never dropping it or throwing', () => {
  expect(
    say({ key: 'activity.linkedin.last_at', op: 'before', value: { last: 3, unit: 'month' } })
  ).toBe('an unknown field, activity.linkedin.last_at, before 3 months ago');
  expect(describeCondition({ condition: { key: 'x', op: 'empty' } })).toBe(
    'an unknown field, x, is empty'
  );
  // Object prototype keys are not fields.
  expect(say({ key: 'constructor', op: 'empty' })).toBe('an unknown field, constructor, is empty');
});
