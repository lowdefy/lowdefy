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

import getAllEnvironmentGuards from './getAllEnvironmentGuards.js';

test('getAllEnvironmentGuards gives every environment a boolean dataPull, true only where set true', () => {
  const environments = {
    '~k': 'k0',
    staging: { dataPull: true, guards: { secrets: { MONGODB_URI: 'staging' } } },
    prod: { guards: { secrets: { MONGODB_URI: 'prod' } } },
    local: { dataPull: false },
  };
  expect(getAllEnvironmentGuards({ environments })).toEqual({
    staging: { dataPull: true, secrets: { MONGODB_URI: 'staging' }, env: {} },
    prod: { dataPull: false, secrets: { MONGODB_URI: 'prod' }, env: {} },
    local: { dataPull: false, secrets: {}, env: {} },
  });
});

test('getAllEnvironmentGuards gives {} with no environments', () => {
  expect(getAllEnvironmentGuards({ environments: undefined })).toEqual({});
});
