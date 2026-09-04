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

import assert from 'node:assert/strict';
import test from 'node:test';

import resolveNotifierIds from './resolveNotifierIds.mjs';

const available = [
  { id: 'n1', name: 'oncall' },
  { id: 'n2', name: 'slack-alerts' },
];

test('resolveNotifierIds maps requested notifier names to their ids', () => {
  assert.deepEqual(
    resolveNotifierIds({
      monitorName: 'lowdefy:app:endpoint:a:error_rate',
      requested: ['oncall', 'slack-alerts'],
      available,
    }),
    ['n1', 'n2']
  );
});

test('resolveNotifierIds accepts a notifier given by id', () => {
  assert.deepEqual(resolveNotifierIds({ monitorName: 'm', requested: ['n2'], available }), ['n2']);
});

test('resolveNotifierIds fails naming the monitor when a requested notifier does not exist', () => {
  assert.throws(
    () => resolveNotifierIds({ monitorName: 'lowdefy:app:m', requested: ['pager'], available }),
    /Axiom has no notifier "pager", requested for monitor "lowdefy:app:m"\. Available notifiers: oncall, slack-alerts\./
  );
});

test('resolveNotifierIds says so when the org has no notifiers at all', () => {
  assert.throws(
    () => resolveNotifierIds({ monitorName: 'm', requested: ['pager'], available: [] }),
    /This Axiom org has no notifiers - create one in Axiom first\./
  );
});

test('resolveNotifierIds keeps the notifiers already attached to the monitor', () => {
  assert.deepEqual(
    resolveNotifierIds({ monitorName: 'm', existingNotifierIds: ['n2'], available }),
    ['n2']
  );
});

test('resolveNotifierIds fails when an attached notifier has been deleted in Axiom', () => {
  assert.throws(
    () => resolveNotifierIds({ monitorName: 'm', existingNotifierIds: ['gone'], available }),
    /Monitor "m" is attached to notifier "gone", which no longer exists in Axiom/
  );
});

test('resolveNotifierIds fails on a monitor that would alert nobody', () => {
  assert.throws(
    () => resolveNotifierIds({ monitorName: 'lowdefy:app:m', available }),
    /Monitor "lowdefy:app:m" has no notifier attached: it would fire and tell nobody\./
  );
});

test('resolveNotifierIds allows an unrouted monitor when allowSilent is set', () => {
  assert.deepEqual(resolveNotifierIds({ monitorName: 'm', available, allowSilent: true }), []);
});
