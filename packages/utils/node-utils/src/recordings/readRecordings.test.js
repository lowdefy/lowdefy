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

import listRecordingFiles from './listRecordingFiles.js';
import readRecordings from './readRecordings.js';

let configDirectory;

function writeTrace({ source, date, id, lines }) {
  const directory = path.join(configDirectory, '.lowdefy', 'traces', source, date);
  fs.mkdirSync(directory, { recursive: true });
  const filePath = path.join(directory, `${id}.jsonl`);
  fs.writeFileSync(filePath, lines.join('\n'));
  return filePath;
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-recordings-'));
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('readRecordings returns records in file then line order', () => {
  writeTrace({
    source: 'dev',
    date: '2026-10-03',
    id: '20261003T140311Z-k3x9qa',
    lines: ['{"n":3}', '{"n":4}'],
  });
  writeTrace({
    source: 'dev',
    date: '2026-10-02',
    id: '20261002T090000Z-aaaaaa',
    lines: ['{"n":1}', '{"n":2}'],
  });
  expect(readRecordings({ configDirectory, source: 'dev' })).toEqual([
    { n: 1 },
    { n: 2 },
    { n: 3 },
    { n: 4 },
  ]);
});

test('readRecordings skips a truncated last line', () => {
  writeTrace({
    source: 'dev',
    date: '2026-10-03',
    id: '20261003T140311Z-k3x9qa',
    lines: ['{"n":1}', '{"n":2}', '{"n":'],
  });
  expect(readRecordings({ configDirectory, source: 'dev' })).toEqual([{ n: 1 }, { n: 2 }]);
});

test('readRecordings throws on a malformed middle line, naming the file and line', () => {
  const filePath = writeTrace({
    source: 'dev',
    date: '2026-10-03',
    id: '20261003T140311Z-k3x9qa',
    lines: ['{"n":1}', 'not json', '{"n":3}'],
  });
  expect(() => readRecordings({ configDirectory, source: 'dev' })).toThrow(
    `Recording file ${filePath} has a malformed line 2.`
  );
});

test('readRecordings skips files in date directories before since', () => {
  const oldFile = writeTrace({
    source: 'dev',
    date: '2026-09-30',
    id: '20260930T100000Z-old000',
    lines: ['{"n":1}'],
  });
  const written = new Date('2026-09-30T10:30:00Z');
  fs.utimesSync(oldFile, written, written);
  writeTrace({
    source: 'dev',
    date: '2026-10-03',
    id: '20261003T100000Z-new000',
    lines: ['{"n":2}'],
  });
  expect(
    readRecordings({ configDirectory, source: 'dev', since: new Date('2026-10-01T12:00:00Z') })
  ).toEqual([{ n: 2 }]);
});

test('readRecordings keeps a session from before since that was written to since', () => {
  const crossing = writeTrace({
    source: 'dev',
    date: '2026-10-02',
    id: '20261002T235000Z-cross0',
    lines: ['{"n":1}', '{"n":2}'],
  });
  const written = new Date('2026-10-03T00:20:00Z');
  fs.utimesSync(crossing, written, written);
  expect(
    readRecordings({ configDirectory, source: 'dev', since: new Date('2026-10-03T00:00:00Z') })
  ).toEqual([{ n: 1 }, { n: 2 }]);
});

test('readRecordings reads only the run file when run is given', () => {
  writeTrace({
    source: 'journey',
    date: '2026-10-03',
    id: '20261003T100000Z-run001',
    lines: ['{"n":1}'],
  });
  writeTrace({
    source: 'journey',
    date: '2026-10-03',
    id: '20261003T110000Z-run002',
    lines: ['{"n":2}'],
  });
  expect(
    readRecordings({ configDirectory, source: 'journey', run: '20261003T110000Z-run002' })
  ).toEqual([{ n: 2 }]);
});

test('readRecordings refuses the production source and unknown sources', () => {
  expect(() => readRecordings({ configDirectory, source: 'production' })).toThrow(
    'Recordings source should be one of dev, journey, explorer. Received "production".'
  );
  expect(() => readRecordings({ configDirectory })).toThrow('Recordings source should be one of');
});

test('readRecordings refuses a run that is not a trace id', () => {
  expect(() => readRecordings({ configDirectory, source: 'journey', run: '../x' })).toThrow(
    'Recordings "run" should be a trace id. Received "../x".'
  );
});

test('readRecordings ignores foreign files and directories', () => {
  writeTrace({
    source: 'dev',
    date: '2026-10-03',
    id: '20261003T100000Z-keep00',
    lines: ['{"n":1}'],
  });
  const dateDirectory = path.join(configDirectory, '.lowdefy', 'traces', 'dev', '2026-10-03');
  fs.writeFileSync(path.join(dateDirectory, 'notes.txt'), 'hello');
  fs.writeFileSync(path.join(dateDirectory, 'not-an-id.jsonl'), '{"n":9}');
  fs.mkdirSync(path.join(configDirectory, '.lowdefy', 'traces', 'dev', 'scratch'));
  fs.writeFileSync(
    path.join(configDirectory, '.lowdefy', 'traces', 'dev', 'loose.jsonl'),
    '{"n":9}'
  );
  expect(readRecordings({ configDirectory, source: 'dev' })).toEqual([{ n: 1 }]);
});

test('readRecordings returns an empty list when nothing was recorded', () => {
  expect(readRecordings({ configDirectory, source: 'explorer' })).toEqual([]);
});

test('listRecordingFiles gives id, date, path and mtime per file', () => {
  const filePath = writeTrace({
    source: 'dev',
    date: '2026-10-03',
    id: '20261003T140311Z-k3x9qa',
    lines: ['{"n":1}'],
  });
  expect(listRecordingFiles({ configDirectory, source: 'dev' })).toEqual([
    {
      id: '20261003T140311Z-k3x9qa',
      date: '2026-10-03',
      path: filePath,
      mtimeMs: fs.statSync(filePath).mtimeMs,
    },
  ]);
});
