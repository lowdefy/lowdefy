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

import getJourneySessionHeaders from './getJourneySessionHeaders.js';

function testWindow(stored) {
  return { sessionStorage: { getItem: () => stored } };
}

test('getJourneySessionHeaders sends the session id the tab is recording under', () => {
  const window = testWindow(JSON.stringify({ sampled: true, session_id: 'sess-1' }));

  expect(getJourneySessionHeaders({ window })).toEqual({ 'x-lowdefy-session': 'sess-1' });
});

test('getJourneySessionHeaders sends the session id of an unsampled session too', () => {
  const window = testWindow(JSON.stringify({ sampled: false, session_id: 'sess-2' }));

  expect(getJourneySessionHeaders({ window })).toEqual({ 'x-lowdefy-session': 'sess-2' });
});

test('getJourneySessionHeaders sends nothing when the tab has no session', () => {
  expect(getJourneySessionHeaders({ window: testWindow(null) })).toEqual({});
});

test('getJourneySessionHeaders sends nothing when the stored session is unreadable', () => {
  expect(getJourneySessionHeaders({ window: testWindow('not json') })).toEqual({});
});

test('getJourneySessionHeaders sends nothing when sessionStorage throws', () => {
  const window = {
    sessionStorage: {
      getItem: () => {
        throw new Error('site data blocked');
      },
    },
  };

  expect(getJourneySessionHeaders({ window })).toEqual({});
});

test('getJourneySessionHeaders sends nothing when there is no browser', () => {
  expect(getJourneySessionHeaders({ window: undefined })).toEqual({});
});
