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
import path from 'node:path';
import test from 'node:test';

import parsePushArgs from './parsePushArgs.mjs';

test('parsePushArgs defaults the build directory and takes no notifiers', () => {
  const args = parsePushArgs({ argv: [] });
  assert.equal(args.buildDirectory, path.resolve('.lowdefy/build'));
  assert.deepEqual(args.notifiers, []);
  assert.equal(args.dryRun, false);
  assert.equal(args.allowSilent, false);
  assert.equal(args.app, null);
});

test('parsePushArgs does not read a flag value as the build directory', () => {
  const args = parsePushArgs({ argv: ['--app', 'invoices', '--notifier', 'oncall'] });
  assert.equal(args.buildDirectory, path.resolve('.lowdefy/build'));
  assert.equal(args.app, 'invoices');
  assert.deepEqual(args.notifiers, ['oncall']);
});

test('parsePushArgs collects a repeated --notifier', () => {
  const args = parsePushArgs({
    argv: ['.lowdefy/build', '--notifier', 'oncall', '--notifier', 'slack-alerts'],
  });
  assert.deepEqual(args.notifiers, ['oncall', 'slack-alerts']);
  assert.equal(args.buildDirectory, path.resolve('.lowdefy/build'));
});

test('parsePushArgs falls back to AXIOM_NOTIFIERS when no --notifier is given', () => {
  const args = parsePushArgs({ argv: [], env: { AXIOM_NOTIFIERS: 'oncall, slack-alerts' } });
  assert.deepEqual(args.notifiers, ['oncall', 'slack-alerts']);
});

test('parsePushArgs prefers --notifier over AXIOM_NOTIFIERS', () => {
  const args = parsePushArgs({
    argv: ['--notifier', 'oncall'],
    env: { AXIOM_NOTIFIERS: 'slack-alerts' },
  });
  assert.deepEqual(args.notifiers, ['oncall']);
});

test('parsePushArgs reads the --dry-run and --allow-silent flags', () => {
  const args = parsePushArgs({ argv: ['--dry-run', '--allow-silent'] });
  assert.equal(args.dryRun, true);
  assert.equal(args.allowSilent, true);
});

test('parsePushArgs throws when a value flag is missing its value', () => {
  assert.throws(
    () => parsePushArgs({ argv: ['--notifier', '--dry-run'] }),
    /--notifier needs a value\./
  );
});

test('parsePushArgs throws on an unknown option', () => {
  assert.throws(
    () => parsePushArgs({ argv: ['--notifiers', 'oncall'] }),
    /Unknown option "--notifiers"/
  );
});
