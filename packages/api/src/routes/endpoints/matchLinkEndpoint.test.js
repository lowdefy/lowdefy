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

import { expect, test } from 'vitest';

import matchLinkEndpoint from './matchLinkEndpoint.js';

const linkEndpoints = [
  { endpointId: 'a/b', segments: ['a', 'b'] },
  { endpointId: 'a', segments: ['a'] },
  { endpointId: 'files', segments: ['files'] },
];

test('matchLinkEndpoint picks the longest link id the path starts with', () => {
  expect(
    matchLinkEndpoint({ linkEndpoints, segments: ['a', 'b', 'log-events', '2024', 'x y+z.png'] })
  ).toEqual({ endpointId: 'a/b', path: 'log-events/2024/x y+z.png' });
});

test('matchLinkEndpoint falls back to a shorter id when the longer one does not match', () => {
  expect(matchLinkEndpoint({ linkEndpoints, segments: ['a', 'c', 'x.png'] })).toEqual({
    endpointId: 'a',
    path: 'c/x.png',
  });
});

test('matchLinkEndpoint returns an empty path for the id alone', () => {
  expect(matchLinkEndpoint({ linkEndpoints, segments: ['files'] })).toEqual({
    endpointId: 'files',
    path: '',
  });
});

test('matchLinkEndpoint returns null when no link id matches', () => {
  expect(matchLinkEndpoint({ linkEndpoints, segments: ['other', 'x.png'] })).toBeNull();
  expect(matchLinkEndpoint({ linkEndpoints, segments: [] })).toBeNull();
  expect(matchLinkEndpoint({ linkEndpoints: [], segments: ['files'] })).toBeNull();
});

test('matchLinkEndpoint does not match an id by a partial segment', () => {
  expect(matchLinkEndpoint({ linkEndpoints, segments: ['filesX', 'x.png'] })).toBeNull();
});
