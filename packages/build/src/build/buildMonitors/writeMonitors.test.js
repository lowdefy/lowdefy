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

import { jest } from '@jest/globals';

import writeMonitors from './writeMonitors.js';

function createContext() {
  return { keyMap: {}, refMap: {}, writeBuildArtifact: jest.fn() };
}

test('writeMonitors writes an empty array when the app declares nothing to watch', async () => {
  const context = createContext();
  await writeMonitors({ components: {}, context });
  expect(context.writeBuildArtifact.mock.calls[0][0]).toBe('monitors.json');
  expect(JSON.parse(context.writeBuildArtifact.mock.calls[0][1])).toEqual([]);
});

test('writeMonitors writes one entry per declared unit', async () => {
  const context = createContext();
  await writeMonitors({
    components: {
      api: [{ endpointId: 'nightly', schedules: [{ cron: '0 0 * * *' }] }],
      connections: [{ connectionId: 'db' }],
    },
    context,
  });
  expect(JSON.parse(context.writeBuildArtifact.mock.calls[0][1]).map((m) => m.id)).toEqual([
    'endpoint:nightly:error_rate',
    'endpoint:nightly:freshness',
    'connection:db:service_error_rate',
  ]);
});
