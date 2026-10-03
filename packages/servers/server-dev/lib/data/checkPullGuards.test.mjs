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

import checkPullGuards from './checkPullGuards.mjs';

const stagingUri = 'mongodb+srv://user:hunter2@acme-staging.a1b2c.mongodb.net/app';
const prodUri = 'mongodb+srv://user:hunter2@acme-prod.z9y8x.mongodb.net/app';

const environmentGuards = {
  staging: {
    dataPull: true,
    secrets: { MONGODB_URI: 'acme-staging\\.a1b2c\\.mongodb\\.net' },
    env: {},
  },
  prod: {
    dataPull: false,
    secrets: { MONGODB_URI: 'acme-prod\\.z9y8x\\.mongodb\\.net' },
    env: {},
  },
  local: { dataPull: true, secrets: {}, env: {} },
};
const connections = [{ connectionId: 'tickets', secretName: 'MONGODB_URI' }];

function check({ from = 'staging', guards = environmentGuards, env }) {
  return () =>
    checkPullGuards({
      connections,
      dataSetName: 'staging-sample',
      from,
      environmentGuards: guards,
      env,
    });
}

function expectRefusal(fn, message) {
  let error;
  try {
    fn();
  } catch (e) {
    error = e;
  }
  expect(error.message).toMatch(message);
  expect(error.message).not.toMatch('hunter2');
  expect(error.message).not.toMatch('mongodb.net');
}

test('checkPullGuards passes a value matching the from guard and no other environment', () => {
  expect(check({ env: { LOWDEFY_SECRET_MONGODB_URI: stagingUri } })).not.toThrow();
});

test('checkPullGuards refuses a from without dataPull: true even when the secret matches its pin', () => {
  expectRefusal(
    check({ from: 'prod', env: { LOWDEFY_SECRET_MONGODB_URI: prodUri } }),
    'Data set "staging-sample" pulls from environment "prod", which does not allow data pulls. Set config.environments.prod.dataPull: true only on a pre-production environment; production must never set it.'
  );
});

test('checkPullGuards refuses a from without dataPull before reading any secret', () => {
  expectRefusal(check({ from: 'prod', env: {} }), 'which does not allow data pulls.');
});

test('checkPullGuards refuses a from whose guards entry has no dataPull', () => {
  const guards = {
    ...environmentGuards,
    staging: { secrets: environmentGuards.staging.secrets, env: {} },
  };
  expectRefusal(
    check({ guards, env: { LOWDEFY_SECRET_MONGODB_URI: stagingUri } }),
    'pulls from environment "staging", which does not allow data pulls.'
  );
});

test('checkPullGuards refuses when from has no guard for the secret', () => {
  expectRefusal(
    check({ from: 'local', env: { LOWDEFY_SECRET_MONGODB_URI: stagingUri } }),
    'Environment local pins no guard for secret MONGODB_URI; add one so a pull can prove which database it reads.'
  );
});

test('checkPullGuards refuses a value that does not match the from guard, without printing it', () => {
  expectRefusal(
    check({ env: { LOWDEFY_SECRET_MONGODB_URI: prodUri } }),
    `Secret "MONGODB_URI" does not match environment "staging"'s guard`
  );
});

test('checkPullGuards refuses an unset secret', () => {
  expectRefusal(
    check({ env: {} }),
    'Secret "MONGODB_URI" is not set (LOWDEFY_SECRET_MONGODB_URI).'
  );
});

test("checkPullGuards refuses a value matching another environment's distinct pattern", () => {
  const guards = {
    ...environmentGuards,
    staging: { dataPull: true, secrets: { MONGODB_URI: 'mongodb\\.net' }, env: {} },
  };
  expectRefusal(
    check({ guards, env: { LOWDEFY_SECRET_MONGODB_URI: prodUri } }),
    `Secret "MONGODB_URI" also matches environment "prod"'s guard, so it may be that environment's database. A pull reads only from "staging".`
  );
});

test('checkPullGuards refuses an undeclared from', () => {
  expectRefusal(
    check({ from: 'qa', env: { LOWDEFY_SECRET_MONGODB_URI: stagingUri } }),
    'Data set "staging-sample" pulls from environment "qa", which config.environments does not declare. Declared: staging, prod, local.'
  );
});

test('checkPullGuards refuses any from when no environments are declared', () => {
  expectRefusal(
    check({ guards: {}, env: { LOWDEFY_SECRET_MONGODB_URI: stagingUri } }),
    'which config.environments does not declare.'
  );
});

test('checkPullGuards is not blocked by an environment with an identical pattern or no pin', () => {
  const guards = {
    ...environmentGuards,
    preview: {
      dataPull: false,
      secrets: { MONGODB_URI: 'acme-staging\\.a1b2c\\.mongodb\\.net' },
      env: {},
    },
  };
  expect(check({ guards, env: { LOWDEFY_SECRET_MONGODB_URI: stagingUri } })).not.toThrow();
});
