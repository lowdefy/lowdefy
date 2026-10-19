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

import dataSessionRegistry from './dataSessionRegistry.js';
import readDataSession from './readDataSession.js';
import { journeyActorToken } from '../../server/auth/journeyActor.js';

afterEach(() => {
  dataSessionRegistry.clear();
});

function register(state) {
  const session = { id: 'abc', state, work: new Set() };
  dataSessionRegistry.set('abc', session);
  return session;
}

test('readDataSession returns null without a data cookie', () => {
  register('open');
  expect(readDataSession(undefined)).toBeNull();
  expect(readDataSession('other=1')).toBeNull();
});

test('readDataSession returns null for a cookie with the wrong token', () => {
  register('open');
  expect(readDataSession('lowdefy_journey_data=forged.abc')).toBeNull();
});

test('readDataSession returns an open or closing session for a verified cookie', () => {
  const session = register('open');
  expect(readDataSession(`a=1; lowdefy_journey_data=${journeyActorToken}.abc`)).toBe(session);
  session.state = 'closing';
  expect(readDataSession(`lowdefy_journey_data=${journeyActorToken}.abc`)).toBe(session);
});

test('readDataSession returns { ended } for a verified cookie naming an unknown or still loading session', () => {
  expect(readDataSession(`lowdefy_journey_data=${journeyActorToken}.gone`)).toEqual({
    ended: 'gone',
  });
  register('loading');
  expect(readDataSession(`lowdefy_journey_data=${journeyActorToken}.abc`)).toEqual({
    ended: 'abc',
  });
});
