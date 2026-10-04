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

import readSnapshotStrings from './readSnapshotStrings.js';

let configDirectory;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-snapshot-strings-'));
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('readSnapshotStrings reads the string leaves of each listed collection and skips EJSON type values', () => {
  const directory = path.join(configDirectory, '.lowdefy', 'data', 'staging');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, 'tickets.jsonl'),
    [
      JSON.stringify({
        _id: { $oid: '65f0c0ffee0000000000abcd' },
        title: ' Staging printer ',
        count: { $numberInt: '42' },
        tags: ['urgent', { label: 'Floor 3' }],
        created: { $date: { $numberLong: '1700000000000' } },
      }),
      '',
      JSON.stringify({ title: 'Second' }),
    ].join('\n')
  );
  fs.writeFileSync(path.join(directory, 'ignored.jsonl'), JSON.stringify({ title: 'Not listed' }));
  const strings = readSnapshotStrings({
    configDirectory,
    name: 'staging',
    manifest: { pulledAt: '2026-10-01T00:00:00.000Z', collections: { tickets: { documents: 2 } } },
  });
  expect([...strings].sort()).toEqual(['Floor 3', 'Second', 'Staging printer', 'urgent']);
});
