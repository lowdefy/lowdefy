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

import listServerSidePackages from './listServerSidePackages.mjs';

test('listServerSidePackages lists packages with server-side types once each, not client-only ones', () => {
  const customTypesMap = {
    actions: { Do: { package: '@app/ui-plugin', version: '1.0.0' } },
    auth: { providers: { Corp: { package: '@app/auth-plugin', version: '1.0.0' } } },
    blocks: { Fancy: { package: '@app/mixed-plugin', version: '1.0.0' } },
    operators: {
      client: { _ui: { package: '@app/ui-plugin', version: '1.0.0' } },
      server: { _srv: { package: '@app/mixed-plugin', version: '1.0.0' } },
    },
    requests: {
      Find: { package: '@app/mixed-plugin', version: '1.0.0' },
      Insert: { package: '@app/mixed-plugin', version: '1.0.0' },
    },
  };

  expect([...listServerSidePackages({ customTypesMap })].sort()).toEqual([
    '@app/auth-plugin',
    '@app/mixed-plugin',
  ]);
});
