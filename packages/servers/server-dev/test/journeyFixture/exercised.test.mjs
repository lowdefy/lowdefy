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

import { fixtureTest, postJourney } from './fixtureClient.mjs';

// What a journey exercised, measured over the real fixture app: the network
// path its browser took, and the endpoints its routines reached through
// CallApi, in-process and detached.

const SAVE_THEN_NOTIFY = [
  { fill: { blockId: 'name_input', value: 'First item' } },
  { click: 'save_button' },
  { wait: { request: 'save_item' } },
  { expect: { text: { blockId: 'save_success', contains: 'Item saved' } } },
  { click: 'notify_button' },
  { expect: { visible: 'notified_text' } },
  // A Link navigation the journey never asserts with expect.url.
  { click: 'link_button' },
  { expect: { visible: 'second_title' } },
];

function byEndpointId(endpoints) {
  return Object.fromEntries(endpoints.map((endpoint) => [endpoint.endpointId, endpoint]));
}

fixtureTest(
  'a journey reports its pages, request calls, endpoints and app events, nested CallApi included',
  async () => {
    const result = await postJourney({ pageId: 'home', steps: SAVE_THEN_NOTIFY });
    expect(result.failure).toBeUndefined();
    expect(result.passed).toBe(true);
    const { exercised } = result;
    expect(exercised.appEvents).toBe(true);
    expect([...exercised.pages].sort()).toEqual(['home', 'second']);
    expect(exercised.requests).toEqual([
      { pageId: 'home', requestId: 'save_item', calls: 1, write: true },
    ]);
    const endpoints = byEndpointId(exercised.endpoints);
    // notify writes only through log_activity and detached_log.
    expect(endpoints.notify).toEqual({ endpointId: 'notify', calls: 1, write: true });
    expect(endpoints.log_activity).toEqual({
      endpointId: 'log_activity',
      via: 'notify',
      calls: null,
      write: true,
    });
    expect(endpoints.detached_log).toEqual({
      endpointId: 'detached_log',
      via: 'notify',
      calls: null,
      write: true,
    });
    expect(exercised.endpoints).toHaveLength(3);
    expect(exercised.unfollowed).toBe(1);
  }
);

fixtureTest('a full reload keeps the request call counts', async () => {
  const result = await postJourney({
    pageId: 'home',
    steps: [
      { fill: { blockId: 'name_input', value: 'Before reload' } },
      { click: 'save_button' },
      { wait: { request: 'save_item' } },
      { goto: 'home' },
      { fill: { blockId: 'name_input', value: 'After reload' } },
      { click: 'save_button' },
      { wait: { request: 'save_item' } },
      { expect: { visible: 'save_success' } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.exercised.requests).toEqual([
    { pageId: 'home', requestId: 'save_item', calls: 2, write: true },
  ]);
});
