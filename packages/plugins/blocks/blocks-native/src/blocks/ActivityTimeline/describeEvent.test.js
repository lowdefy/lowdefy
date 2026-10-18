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

import describeEvent from './describeEvent.js';

const sam = { id: 'u1', name: 'Sam Tolmay' };
const actor = { kind: 'actor', id: 'u1', name: 'Sam Tolmay', agent: false, picture: null };

const formatEvent = {
  'status-change': [
    {
      when: { 'what.from': null },
      icon: 'CirclePlus',
      text: '{actor} created the task in **{what.to|humanize}**',
    },
    { when: { 'what.to': ['done', 'released'] }, icon: 'CircleCheck', tone: 'success' },
    { icon: 'CircleDot', tone: 'primary', text: '{actor} moved it to **{what.to|humanize}**' },
  ],
  'block-set': { icon: 'Lock', tone: 'danger', text: '{actor} blocked it', note: '{what.reason}' },
  default: { icon: 'Pencil' },
};

test('describeEvent words an event with the first rule whose when matches', () => {
  const line = describeEvent({
    entry: { id: 'e1', type: 'status-change', by: sam, what: { from: 'todo', to: 'in_progress' } },
    formatEvent,
  });
  expect(line).toEqual({
    actor,
    icon: 'CircleDot',
    tone: 'primary',
    segments: [
      actor,
      { kind: 'text', text: ' moved it to ' },
      { kind: 'strong', text: 'In progress' },
    ],
    note: null,
  });
});

test('describeEvent matches a when of null to a missing value', () => {
  const line = describeEvent({
    entry: { id: 'e1', type: 'status-change', by: sam, what: { to: 'backlog' } },
    formatEvent,
  });
  expect(line.icon).toBe('CirclePlus');
  expect(line.segments).toEqual([
    actor,
    { kind: 'text', text: ' created the task in ' },
    { kind: 'strong', text: 'Backlog' },
  ]);
});

test('describeEvent matches a when list to any of its values, over the default rule', () => {
  const line = describeEvent({
    entry: { id: 'e1', type: 'status-change', by: sam, what: { from: 'todo', to: 'done' } },
    formatEvent,
  });
  expect(line.icon).toBe('CircleCheck');
  expect(line.tone).toBe('success');
  expect(line.segments).toEqual([actor, { kind: 'text', text: ' status change' }]);
});

test('describeEvent fills a note from the event', () => {
  const line = describeEvent({
    entry: { id: 'e1', type: 'block-set', by: sam, what: { reason: 'Waiting on legal' } },
    formatEvent,
  });
  expect(line.note).toBe('Waiting on legal');
  const noReason = describeEvent({ entry: { id: 'e2', type: 'block-set', by: sam }, formatEvent });
  expect(noReason.note).toBeNull();
});

test('describeEvent words an unknown type with the default rule', () => {
  const line = describeEvent({
    entry: { id: 'e1', type: 'file-added', by: { name: 'Nigel', agent: true } },
    formatEvent,
  });
  expect(line.icon).toBe('Pencil');
  expect(line.tone).toBe('neutral');
  expect(line.segments).toEqual([
    { kind: 'actor', id: null, name: 'Nigel', agent: true, picture: null },
    { kind: 'text', text: ' file added' },
  ]);
});

test('describeEvent takes an entry already worded over its rule', () => {
  const line = describeEvent({
    entry: {
      id: 'e1',
      type: 'status-change',
      by: sam,
      text: '{actor} shipped **{subject.key}**',
      icon: 'Rocket',
      tone: '#8B5CF6',
      subject: { key: 'PEL-12' },
    },
    formatEvent,
  });
  expect(line.icon).toBe('Rocket');
  expect(line.tone).toBe('#8B5CF6');
  expect(line.segments).toEqual([
    actor,
    { kind: 'text', text: ' shipped ' },
    { kind: 'strong', text: 'PEL-12' },
  ]);
});

test('describeEvent names someone from members by id, else Someone', () => {
  const members = [{ value: 'u9', label: 'Ada Lovelace' }];
  expect(describeEvent({ entry: { type: 'x', by: { id: 'u9' } }, members }).actor.name).toBe(
    'Ada Lovelace'
  );
  expect(describeEvent({ entry: { type: 'x' } }).actor.name).toBe('Someone');
});
