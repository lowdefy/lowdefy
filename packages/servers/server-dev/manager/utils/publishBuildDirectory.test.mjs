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
import fsPromises from 'fs/promises';
import os from 'os';
import path from 'path';
import { jest } from '@jest/globals';

import publishBuildDirectory from './publishBuildDirectory.mjs';

// The publish-window tests move 200 files through several thread pool fs calls
// each while a poller runs on every loop turn, and the locked-rename test waits
// out the full 3.3 s retry schedule. On a loaded machine they pass jest's 5 s
// default, and a timed-out poller then fails the next test.
jest.setTimeout(30000);

let root;
let buildDirectory;
let stagingDirectory;

function write(directory, file, content) {
  const filePath = path.join(directory, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function read(file) {
  return fs.readFileSync(path.join(buildDirectory, file), 'utf8');
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-publish-build-'));
  buildDirectory = path.join(root, 'build');
  stagingDirectory = path.join(root, 'build-staging');
  write(stagingDirectory, 'pageRegistry.json', 'new');
});

afterEach(() => {
  jest.restoreAllMocks();
  fs.rmSync(root, { recursive: true, force: true });
});

function lockedError(code) {
  return Object.assign(new Error(`${code}: resource busy or locked, rename`), { code });
}

test('publishBuildDirectory replaces live files with the staged build', async () => {
  write(buildDirectory, 'app.json', 'old');
  write(buildDirectory, 'connections/db.json', 'old');
  write(stagingDirectory, 'app.json', 'new');
  write(stagingDirectory, 'connections/db.json', 'new');
  write(stagingDirectory, 'api/endpoint.json', 'new');

  await publishBuildDirectory({ buildDirectory, stagingDirectory });

  expect(read('app.json')).toBe('new');
  expect(read('connections/db.json')).toBe('new');
  expect(read('api/endpoint.json')).toBe('new');
});

test('publishBuildDirectory removes live files the new build did not write', async () => {
  write(buildDirectory, 'app.json', 'old');
  write(buildDirectory, 'connections/removed.json', 'old');
  write(buildDirectory, 'pages/jit-page.json', 'old');
  write(stagingDirectory, 'app.json', 'new');

  await publishBuildDirectory({ buildDirectory, stagingDirectory });

  expect(fs.existsSync(path.join(buildDirectory, 'connections/removed.json'))).toBe(false);
  expect(fs.existsSync(path.join(buildDirectory, 'pages/jit-page.json'))).toBe(false);
  expect(read('app.json')).toBe('new');
});

test('publishBuildDirectory removes the staging directory', async () => {
  write(stagingDirectory, 'app.json', 'new');

  await publishBuildDirectory({ buildDirectory, stagingDirectory });

  expect(fs.existsSync(stagingDirectory)).toBe(false);
});

test('publishBuildDirectory creates the live directory on the first build', async () => {
  write(stagingDirectory, 'app.json', 'new');

  await publishBuildDirectory({ buildDirectory, stagingDirectory });

  expect(read('app.json')).toBe('new');
});

test('an artifact present in both builds exists at every point of the publish', async () => {
  write(buildDirectory, 'connections/db.json', 'old');
  write(stagingDirectory, 'connections/db.json', 'new');
  for (let i = 0; i < 200; i++) {
    write(buildDirectory, `api/endpoint-${i}.json`, 'old');
    write(stagingDirectory, `api/endpoint-${i}.json`, 'new');
  }

  let checks = 0;
  let missing = 0;
  let publishing = true;
  const check = () => {
    checks += 1;
    if (!fs.existsSync(path.join(buildDirectory, 'connections/db.json'))) {
      missing += 1;
    }
    if (publishing) {
      setImmediate(check);
    }
  };
  setImmediate(check);
  await publishBuildDirectory({ buildDirectory, stagingDirectory });
  publishing = false;

  expect(checks).toBeGreaterThan(1);
  expect(missing).toBe(0);
  expect(read('connections/db.json')).toBe('new');
});

test('the page registry arrives after every other new file and after stale files are removed', async () => {
  write(buildDirectory, 'pageRegistry.json', 'old');
  write(buildDirectory, 'pages/jit-page/jit-page.json', 'old');
  for (let i = 0; i < 200; i++) {
    write(buildDirectory, `api/endpoint-${i}.json`, 'old');
    write(stagingDirectory, `api/endpoint-${i}.json`, 'new');
  }

  let checks = 0;
  let early = 0;
  let publishing = true;
  const check = () => {
    if (!publishing) {
      return;
    }
    checks += 1;
    if (read('pageRegistry.json') === 'new') {
      const oldEndpoint = [...Array(200).keys()].some(
        (i) => read(`api/endpoint-${i}.json`) === 'old'
      );
      const stalePage = fs.existsSync(path.join(buildDirectory, 'pages/jit-page/jit-page.json'));
      if (oldEndpoint || stalePage) {
        early += 1;
      }
    }
    setImmediate(check);
  };
  setImmediate(check);
  await publishBuildDirectory({ buildDirectory, stagingDirectory });
  publishing = false;

  expect(checks).toBeGreaterThan(1);
  expect(early).toBe(0);
  expect(read('pageRegistry.json')).toBe('new');
});

test('publishBuildDirectory keeps the control files the manager and dev tools write', async () => {
  write(buildDirectory, '.restart', '{"reason":"Added a block type"}');
  write(buildDirectory, 'buildStatus.json', '{"status":"ok"}');
  write(buildDirectory, 'invalidatePages', '1');
  write(buildDirectory, 'reload', '1');
  write(stagingDirectory, 'app.json', 'new');
  write(stagingDirectory, 'pageRegistry.json', '{}');

  await publishBuildDirectory({ buildDirectory, stagingDirectory });

  expect(read('.restart')).toBe('{"reason":"Added a block type"}');
  expect(read('buildStatus.json')).toBe('{"status":"ok"}');
  expect(read('invalidatePages')).toBe('1');
  expect(read('reload')).toBe('1');
});

test('publishBuildDirectory retries a rename while another process holds the file', async () => {
  write(buildDirectory, 'app.json', 'old');
  write(stagingDirectory, 'app.json', 'new');
  jest
    .spyOn(fsPromises, 'rename')
    .mockRejectedValueOnce(lockedError('EPERM'))
    .mockRejectedValueOnce(lockedError('EBUSY'));

  await publishBuildDirectory({ buildDirectory, stagingDirectory });

  expect(read('app.json')).toBe('new');
  expect(read('pageRegistry.json')).toBe('new');
});

test('publishBuildDirectory fails with the rename error when a file stays locked', async () => {
  write(stagingDirectory, 'app.json', 'new');
  const rename = jest.spyOn(fsPromises, 'rename').mockRejectedValue(lockedError('EPERM'));

  await expect(publishBuildDirectory({ buildDirectory, stagingDirectory })).rejects.toThrow(
    'EPERM: resource busy or locked, rename'
  );
  expect(rename).toHaveBeenCalledTimes(11);
});

function setMtime(file, seconds) {
  fs.utimesSync(path.join(buildDirectory, file), seconds, seconds);
}

function mtime(file) {
  return fs.statSync(path.join(buildDirectory, file)).mtimeMs;
}

test('publishBuildDirectory leaves an unchanged artifact in place and replaces a changed one', async () => {
  write(buildDirectory, 'app.json', 'same');
  write(buildDirectory, 'client/page.json', 'old');
  write(buildDirectory, 'client/sized.json', 'aaa');
  setMtime('app.json', 1000);
  setMtime('client/page.json', 1000);
  setMtime('client/sized.json', 1000);
  write(stagingDirectory, 'app.json', 'same');
  write(stagingDirectory, 'client/page.json', 'new');
  write(stagingDirectory, 'client/sized.json', 'bbb');

  await publishBuildDirectory({ buildDirectory, stagingDirectory });

  expect(mtime('app.json')).toBe(1000 * 1000);
  expect(read('client/page.json')).toBe('new');
  expect(mtime('client/page.json')).not.toBe(1000 * 1000);
  expect(read('client/sized.json')).toBe('bbb');
  expect(fs.existsSync(stagingDirectory)).toBe(false);
});

test('publishBuildDirectory moves a byte-identical page registry and id counter anyway', async () => {
  write(buildDirectory, 'pageRegistry.json', 'new');
  write(buildDirectory, 'idCounter.json', '{"prefix":"a1b2"}');
  setMtime('pageRegistry.json', 1000);
  setMtime('idCounter.json', 1000);
  write(stagingDirectory, 'idCounter.json', '{"prefix":"a1b2"}');

  await publishBuildDirectory({ buildDirectory, stagingDirectory });

  expect(mtime('pageRegistry.json')).not.toBe(1000 * 1000);
  expect(mtime('idCounter.json')).not.toBe(1000 * 1000);
});

test('publishBuildDirectory removes stale files and keeps control files when artifacts are unchanged', async () => {
  write(buildDirectory, 'app.json', 'same');
  write(buildDirectory, 'jitMaps/abc-1-1.json', '{}');
  write(buildDirectory, 'buildStatus.json', '{"status":"ok"}');
  write(stagingDirectory, 'app.json', 'same');

  await publishBuildDirectory({ buildDirectory, stagingDirectory });

  expect(read('app.json')).toBe('same');
  expect(fs.existsSync(path.join(buildDirectory, 'jitMaps/abc-1-1.json'))).toBe(false);
  expect(read('buildStatus.json')).toBe('{"status":"ok"}');
  expect(fs.existsSync(stagingDirectory)).toBe(false);
});
