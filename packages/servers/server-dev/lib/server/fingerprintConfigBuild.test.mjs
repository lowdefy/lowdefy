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

import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import fingerprintConfigBuild, { sameFingerprint } from './fingerprintConfigBuild.js';

let buildDirectory;

function write(file, content) {
  const filePath = path.join(buildDirectory, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(`${filePath}.tmp`, content);
  // A config publish renames each changed artifact into place.
  fs.renameSync(`${filePath}.tmp`, filePath);
}

// The artifacts one config build writes, keyed with its prefix.
function writeConfigBuild({ prefix, title = 'Docs', buildId = prefix, menu = 'Home' }) {
  write('idCounter.json', JSON.stringify({ prefix, counter: 20 }));
  write('global.json', JSON.stringify({ title, '~k': `${prefix}1` }));
  write('appMeta.json', JSON.stringify({ name: 'docs', buildId, '~k': `${prefix}2` }));
  write('modules.json', JSON.stringify({ team: { '~r': `${prefix}3`, vars: {} } }));
  write('menus.json', JSON.stringify([{ title: menu, '~k': `${prefix}4` }]));
  write('keyMap.json', JSON.stringify({ [`${prefix}1`]: { s: 'root' } }));
  write('api/one.json', JSON.stringify({ endpointId: 'one', '~k': `${prefix}5` }));
}

beforeEach(() => {
  buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-fingerprint-'));
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

test('two config builds of the same config have the same fingerprint, whatever their key prefixes and build ids', () => {
  writeConfigBuild({ prefix: 'a1b2_' });
  const first = fingerprintConfigBuild({ buildDirectory, previous: null });
  writeConfigBuild({ prefix: 'c3d4_' });
  const second = fingerprintConfigBuild({ buildDirectory, previous: first });

  expect(second.prefix).toBe('c3d4_');
  expect(sameFingerprint(first, second)).toBe(true);
});

test('a config build that writes an object with its keys in another order has another fingerprint', () => {
  writeConfigBuild({ prefix: 'a1b2_' });
  write('deferredRecords.json', JSON.stringify({ style: { marginTop: 8, margin: 0 } }));
  const first = fingerprintConfigBuild({ buildDirectory, previous: null });
  write('deferredRecords.json', JSON.stringify({ style: { margin: 0, marginTop: 8 } }));

  expect(sameFingerprint(first, fingerprintConfigBuild({ buildDirectory, previous: first }))).toBe(
    false
  );
});

test('a config build that changes a page build input has another fingerprint', () => {
  writeConfigBuild({ prefix: 'a1b2_' });
  const first = fingerprintConfigBuild({ buildDirectory, previous: null });
  writeConfigBuild({ prefix: 'c3d4_', title: 'Changed' });

  expect(sameFingerprint(first, fingerprintConfigBuild({ buildDirectory, previous: first }))).toBe(
    false
  );
});

test('a config build that adds or removes a page build input has another fingerprint', () => {
  writeConfigBuild({ prefix: 'a1b2_' });
  const first = fingerprintConfigBuild({ buildDirectory, previous: null });
  write('tenantTargets.json', '{}');
  const added = fingerprintConfigBuild({ buildDirectory, previous: first });
  fs.rmSync(path.join(buildDirectory, 'tenantTargets.json'));

  expect(sameFingerprint(first, added)).toBe(false);
  expect(sameFingerprint(added, fingerprintConfigBuild({ buildDirectory, previous: added }))).toBe(
    false
  );
});

test('the files page builds do not read, and what the dev server writes, leave the fingerprint as it was', () => {
  writeConfigBuild({ prefix: 'a1b2_' });
  const first = fingerprintConfigBuild({ buildDirectory, previous: null });
  writeConfigBuild({ prefix: 'c3d4_', menu: 'Start' });
  write('api/two.json', '{}');
  write('pages/home.json', '{}');
  write('jitMaps/abc123-1-1.json', '{}');
  write('plugins/operators/clientJsMap.js', 'export default {};');
  write('invalidatePages', '2');

  expect(sameFingerprint(first, fingerprintConfigBuild({ buildDirectory, previous: first }))).toBe(
    true
  );
});

test('a file unchanged since the previous fingerprint is not read again', () => {
  writeConfigBuild({ prefix: 'a1b2_' });
  write('customTypesMap.json', '{"blocks":{}}');
  const first = fingerprintConfigBuild({ buildDirectory, previous: null });
  write('global.json', JSON.stringify({ title: 'Docs', '~k': 'a1b2_1' }));
  const readFileSync = vi.spyOn(fs, 'readFileSync');

  const second = fingerprintConfigBuild({ buildDirectory, previous: first });

  const read = readFileSync.mock.calls.map(([filePath]) => path.basename(filePath));
  expect(read).toContain('global.json');
  expect(read).not.toContain('customTypesMap.json');
  expect(read).not.toContain('modules.json');
  expect(sameFingerprint(first, second)).toBe(true);
});

test('fingerprints of two build directories differ', () => {
  writeConfigBuild({ prefix: 'a1b2_' });
  const first = fingerprintConfigBuild({ buildDirectory, previous: null });
  const other = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-fingerprint-'));
  fs.cpSync(buildDirectory, other, { recursive: true });

  expect(
    sameFingerprint(first, fingerprintConfigBuild({ buildDirectory: other, previous: first }))
  ).toBe(false);
  fs.rmSync(other, { recursive: true, force: true });
});
