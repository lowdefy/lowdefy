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

import fs from 'node:fs';
import path from 'node:path';

import { afterEach, expect, test } from 'vitest';

import writeTestBuild from '../test/writeTestBuild.mjs';
import getDirectories from './getDirectories.js';
import readBuildSecretNames from './readBuildSecretNames.js';

const builds = [];

afterEach(() => {
  builds.splice(0).forEach((build) => build.remove());
});

test('readBuildSecretNames lists the secrets named in connections, endpoints, page requests and the auth config, once each and sorted', () => {
  const build = writeTestBuild({
    authJson: { configured: true, secret: { _secret: 'AUTH_SECRET' } },
    endpoints: [
      {
        endpointId: 'charge',
        routine: [{ properties: { key: { _secret: 'STRIPE_KEY' } } }],
      },
    ],
  });
  builds.push(build);
  const directories = getDirectories(build);
  const buildDirectory = directories.build;
  fs.mkdirSync(path.join(buildDirectory, 'connections', 'billing'), { recursive: true });
  fs.writeFileSync(
    path.join(buildDirectory, 'connections', 'billing', 'ledger.json'),
    JSON.stringify({ properties: { databaseUri: { _secret: 'MONGODB_URI' } } })
  );
  fs.mkdirSync(path.join(buildDirectory, 'pages', 'home', 'requests'), { recursive: true });
  fs.writeFileSync(
    path.join(buildDirectory, 'pages', 'home', 'requests', 'send.json'),
    JSON.stringify({ properties: { token: { _secret: 'STRIPE_KEY' }, to: { _secret: 'MAIL_TO' } } })
  );
  // Not JSON, so not read, whatever it holds.
  fs.writeFileSync(path.join(buildDirectory, 'notes.txt'), '{"_secret":"IGNORED"}');

  expect(readBuildSecretNames({ directories })).toEqual([
    'AUTH_SECRET',
    'MAIL_TO',
    'MONGODB_URI',
    'STRIPE_KEY',
  ]);
});

test('readBuildSecretNames returns nothing for a build that names no secret', () => {
  const build = writeTestBuild();
  builds.push(build);
  expect(readBuildSecretNames({ directories: getDirectories(build) })).toEqual([]);
});

test('readBuildSecretNames with a cache reads a file again only once it changes, and forgets a removed one', () => {
  const build = writeTestBuild();
  builds.push(build);
  const directories = getDirectories(build);
  const requestsDirectory = path.join(directories.build, 'pages', 'later', 'requests');
  const cache = new Map();
  expect(readBuildSecretNames({ directories, cache })).toEqual([]);
  // A page built on demand after the first read.
  fs.mkdirSync(requestsDirectory, { recursive: true });
  const requestPath = path.join(requestsDirectory, 'send.json');
  fs.writeFileSync(requestPath, JSON.stringify({ properties: { key: { _secret: 'MAIL_KEY' } } }));
  expect(readBuildSecretNames({ directories, cache })).toEqual(['MAIL_KEY']);
  expect(cache.get(requestPath).names).toEqual(new Set(['MAIL_KEY']));
  // Rebuilt with another secret: its size changes, so it is read again.
  fs.writeFileSync(
    requestPath,
    JSON.stringify({ properties: { key: { _secret: 'MAIL_API_KEY' } } })
  );
  expect(readBuildSecretNames({ directories, cache })).toEqual(['MAIL_API_KEY']);
  fs.rmSync(requestPath);
  expect(readBuildSecretNames({ directories, cache })).toEqual([]);
  expect(cache.has(requestPath)).toBe(false);
});

test('readBuildSecretNames with a cache skips a file still being written, and reads it once whole', () => {
  const build = writeTestBuild();
  builds.push(build);
  const directories = getDirectories(build);
  const requestsDirectory = path.join(directories.build, 'pages', 'later', 'requests');
  fs.mkdirSync(requestsDirectory, { recursive: true });
  const requestPath = path.join(requestsDirectory, 'send.json');
  // Half written: it holds the operator but does not parse yet.
  fs.writeFileSync(requestPath, '{"properties":{"key":{"_secret":"MAIL_KEY"');
  const cache = new Map();
  expect(readBuildSecretNames({ directories, cache })).toEqual([]);
  expect(cache.has(requestPath)).toBe(false);
  fs.writeFileSync(requestPath, JSON.stringify({ properties: { key: { _secret: 'MAIL_KEY' } } }));
  expect(readBuildSecretNames({ directories, cache })).toEqual(['MAIL_KEY']);
});
