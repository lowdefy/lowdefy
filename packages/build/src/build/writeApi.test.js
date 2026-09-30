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

import { serializer } from '@lowdefy/helpers';

import writeApi from './writeApi.js';
import testContext from '../test-utils/testContext.js';

async function getSchedulesManifest(components) {
  const writeBuildArtifact = jest.fn();
  const context = testContext({ writeBuildArtifact });
  await writeApi({ components, context });
  const call = writeBuildArtifact.mock.calls.find(([name]) => name === 'schedules.json');
  return call ? serializer.deserializeFromString(call[1]) : undefined;
}

const environments = {
  prod: { url: 'https://app.example.com' },
  staging: { url: 'https://staging.example.com', cron: { secret: 'STAGING_CRON_SECRET' } },
  develop: {
    url: 'https://develop.example.com',
    cron: { secret: 'DEVELOP_CRON_SECRET', enabled: false },
  },
  local: {},
};

const api = [
  {
    endpointId: 'tick',
    schedules: {
      default: [{ cron: '*/5 * * * *' }],
      prod: [{ cron: '*/5 * * * *' }],
      staging: [{ cron: '0 * * * *' }],
      develop: [{ cron: '0 * * * *' }],
      local: [{ cron: '*/5 * * * *' }],
    },
  },
];

test('writeApi registers plain schedules without config.environments', async () => {
  const manifest = await getSchedulesManifest({
    config: {},
    api: [{ endpointId: 'tick', schedules: [{ cron: '0 2 * * *', payload: { a: 1 } }] }],
  });
  expect(manifest).toEqual([{ endpointId: 'tick', cron: '0 2 * * *', payload: { a: 1 } }]);
});

test('writeApi registers own schedules and forwards to cron.secret environments on the cron host', async () => {
  const manifest = await getSchedulesManifest({
    config: { environments, environment: 'prod' },
    api,
  });
  expect(manifest).toEqual([
    { endpointId: 'tick', cron: '*/5 * * * *', payload: {}, environment: 'prod', forward: false },
    { endpointId: 'tick', cron: '0 * * * *', payload: {}, environment: 'staging', forward: true },
  ]);
});

test('writeApi registers only its own schedules on a forwarded environment', async () => {
  const manifest = await getSchedulesManifest({
    config: { environments, environment: 'staging' },
    api,
  });
  expect(manifest).toEqual([
    { endpointId: 'tick', cron: '0 * * * *', payload: {}, environment: 'staging', forward: false },
  ]);
});

test('writeApi registers nothing for an environment with cron.enabled false', async () => {
  const manifest = await getSchedulesManifest({
    config: { environments, environment: 'develop' },
    api,
  });
  expect(manifest).toBeUndefined();
});

test('writeApi registers the default schedules without a current environment', async () => {
  const manifest = await getSchedulesManifest({ config: { environments }, api });
  expect(manifest).toEqual([{ endpointId: 'tick', cron: '*/5 * * * *', payload: {} }]);
});
