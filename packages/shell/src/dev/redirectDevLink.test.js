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

import redirectDevLink from './redirectDevLink.js';

jest.mock('../config/getShellConfig.js', () => () => ({ scheme: 'lowdefy-dev' }));

const { getShellVariant } = require('../../shellVariant.js');

test('a Lowdefy Dev link is left to DevShell: home on launch, nothing while running', () => {
  const link = 'lowdefy-dev://connect?url=http%3A%2F%2F192.168.1.20%3A3000&pair=k3x9q';
  expect(redirectDevLink({ initial: true, path: link })).toBe('/');
  expect(redirectDevLink({ initial: false, path: link })).toBeNull();
  expect(redirectDevLink({ initial: false, path: 'lowdefy-dev://menu' })).toBeNull();
});

test('any other link is routed as a page path', () => {
  expect(redirectDevLink({ initial: false, path: 'lowdefy-dev://tickets/7' })).toBe(
    'lowdefy-dev://tickets/7'
  );
  expect(redirectDevLink({ initial: true, path: '/tickets/7' })).toBe('/tickets/7');
});

test('Lowdefy Dev builds as dev and every other shell as release unless the build says', () => {
  expect(getShellVariant({})).toBe('dev');
  expect(getShellVariant({ LOWDEFY_SHELL_CONFIG: 'shell.json' })).toBe('release');
  expect(getShellVariant({ LOWDEFY_SHELL_VARIANT: 'release' })).toBe('release');
  expect(
    getShellVariant({ LOWDEFY_SHELL_CONFIG: 'shell.json', LOWDEFY_SHELL_VARIANT: 'dev' })
  ).toBe('dev');
  expect(() => getShellVariant({ LOWDEFY_SHELL_VARIANT: 'prod' })).toThrow(
    'LOWDEFY_SHELL_VARIANT must be "dev" or "release". Received "prod".'
  );
});
