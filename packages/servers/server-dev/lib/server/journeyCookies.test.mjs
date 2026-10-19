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
import { fileURLToPath } from 'node:url';

import { journeyActorToken } from './auth/journeyActor.js';
import {
  JOURNEY_COOKIES,
  forwardJourneyCookies,
  readJourneyCookie,
  writeJourneyCookie,
} from './journeyCookies.js';

const origin = 'http://localhost:3111';
const forgedToken = '0'.repeat(journeyActorToken.length);

function header(cookies) {
  return cookies.map(({ name, value }) => `${name}=${value}`).join('; ');
}

test('writeJourneyCookie writes a signed, httpOnly, Lax cookie scoped to the origin', () => {
  expect(
    writeJourneyCookie({ name: JOURNEY_COOKIES.mutant.name, payload: 'run1', origin })
  ).toEqual({
    name: 'lowdefy_journey_mutant',
    value: `${journeyActorToken}.run1`,
    url: origin,
    httpOnly: true,
    sameSite: 'Lax',
  });
});

test('writeJourneyCookie throws for a name outside the journey cookie table', () => {
  expect(() => writeJourneyCookie({ name: 'session', payload: 'x', origin })).toThrow(
    '"session" is not a journey cookie.'
  );
});

test('readJourneyCookie returns the payload of a cookie writeJourneyCookie wrote', () => {
  const cookie = writeJourneyCookie({
    name: JOURNEY_COOKIES.actor.name,
    payload: '203.0.113.7',
    origin,
  });
  expect(
    readJourneyCookie({
      cookieHeader: `session=abc; ${header([cookie])}; other=1`,
      name: JOURNEY_COOKIES.actor.name,
    })
  ).toEqual('203.0.113.7');
});

test.each([
  ['a wrong token', `lowdefy_journey_mutant=${forgedToken}.run1`],
  ['a shorter token', 'lowdefy_journey_mutant=abc.run1'],
  ['a missing separator', `lowdefy_journey_mutant=${journeyActorToken}`],
  ['only another cookie name', `lowdefy_journey_data=${journeyActorToken}.run1`],
  ['a cookie whose name only ends in the name', `x_lowdefy_journey_mutant=${journeyActorToken}.r`],
  ['no cookie header', undefined],
  ['an empty cookie header', ''],
])('readJourneyCookie returns null for %s', (_, cookieHeader) => {
  expect(readJourneyCookie({ cookieHeader, name: JOURNEY_COOKIES.mutant.name })).toBeNull();
});

test('forwardJourneyCookies joins the verified data and mutant cookies and leaves out the rest', () => {
  const cookieHeader = header([
    { name: 'session', value: 'abc' },
    writeJourneyCookie({ name: JOURNEY_COOKIES.actor.name, payload: '203.0.113.7', origin }),
    writeJourneyCookie({ name: JOURNEY_COOKIES.recording.name, payload: 'rec', origin }),
    writeJourneyCookie({ name: JOURNEY_COOKIES.data.name, payload: 'data1', origin }),
    writeJourneyCookie({ name: JOURNEY_COOKIES.mutant.name, payload: 'mutant1', origin }),
  ]);
  expect(forwardJourneyCookies({ cookieHeader })).toEqual(
    `lowdefy_journey_data=${journeyActorToken}.data1; lowdefy_journey_mutant=${journeyActorToken}.mutant1`
  );
});

test('forwardJourneyCookies leaves out a loopback cookie that fails verification', () => {
  const cookieHeader = header([
    { name: JOURNEY_COOKIES.data.name, value: `${forgedToken}.data1` },
    writeJourneyCookie({ name: JOURNEY_COOKIES.mutant.name, payload: 'mutant1', origin }),
  ]);
  expect(forwardJourneyCookies({ cookieHeader })).toEqual(
    `lowdefy_journey_mutant=${journeyActorToken}.mutant1`
  );
});

test('forwardJourneyCookies forwards a data session the call opened itself in place of a data cookie', () => {
  const cookieHeader = header([
    writeJourneyCookie({ name: JOURNEY_COOKIES.data.name, payload: 'data1', origin }),
    writeJourneyCookie({ name: JOURNEY_COOKIES.mutant.name, payload: 'mutant1', origin }),
  ]);
  expect(forwardJourneyCookies({ cookieHeader, dataSessionId: 'own1' })).toEqual(
    `lowdefy_journey_data=${journeyActorToken}.own1; lowdefy_journey_mutant=${journeyActorToken}.mutant1`
  );
  expect(forwardJourneyCookies({ cookieHeader: undefined, dataSessionId: 'own1' })).toEqual(
    `lowdefy_journey_data=${journeyActorToken}.own1`
  );
});

test('forwardJourneyCookies returns an empty string with no journey cookies', () => {
  expect(forwardJourneyCookies({ cookieHeader: undefined })).toEqual('');
  expect(forwardJourneyCookies({ cookieHeader: 'session=abc' })).toEqual('');
});

// One writer, so a wrapper (data set, mutant) can never drop another's cookie
// from the detached hop.
test('createLowdefyContext is the only writer of loopbackHeaders in server-dev', () => {
  const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const writers = [];
  function walk(directory) {
    fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
        return;
      }
      if (!/\.(js|mjs|jsx)$/.test(entry.name) || /\.test\.mjs$/.test(entry.name)) {
        return;
      }
      if (/loopbackHeaders\s*(=[^=]|\]\s*=|:)/.test(fs.readFileSync(entryPath, 'utf8'))) {
        writers.push(path.relative(packageRoot, entryPath));
      }
    });
  }
  ['lib', 'src', 'client', 'manager'].forEach((directory) =>
    walk(path.join(packageRoot, directory))
  );
  expect(writers).toEqual([path.join('lib', 'server', 'createLowdefyContext.js')]);
});
