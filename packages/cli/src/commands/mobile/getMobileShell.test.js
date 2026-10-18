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

import getMobileShell from './getMobileShell.js';

const config = {
  environments: {
    production: { url: 'https://field.example.com' },
    staging: { url: 'https://staging.field.example.com' },
    '~k': 'k1',
  },
};

test('getMobileShell takes the only shell when no --shell is given', () => {
  expect(
    getMobileShell({
      mobileConfig: { shells: [{ id: 'field' }] },
      config,
      environment: 'staging',
    })
  ).toEqual({ shell: { id: 'field' }, url: 'https://staging.field.example.com' });
});

test('getMobileShell picks the shell named by --shell', () => {
  const { shell } = getMobileShell({
    mobileConfig: { shells: [{ id: 'field' }, { id: 'ops' }] },
    config,
    shellId: 'ops',
    environment: 'production',
  });
  expect(shell).toEqual({ id: 'ops' });
});

test('getMobileShell fails naming both shells when the app has two and no --shell', () => {
  expect(() =>
    getMobileShell({
      mobileConfig: { shells: [{ id: 'field' }, { id: 'ops' }] },
      config,
      environment: 'production',
    })
  ).toThrow('The app declares 2 shells (field, ops). Pick one with --shell <id>.');
});

test('getMobileShell fails on an unknown shell id', () => {
  expect(() =>
    getMobileShell({
      mobileConfig: { shells: [{ id: 'field' }] },
      config,
      shellId: 'ops',
      environment: 'production',
    })
  ).toThrow('The app has no shell "ops". Shells: field.');
});

test('getMobileShell fails when the app declares no shells', () => {
  expect(() => getMobileShell({ mobileConfig: {}, config, environment: 'production' })).toThrow(
    'The app declares no phone shells. Add one under "mobile.shells" in lowdefy.yaml.'
  );
});

test('getMobileShell fails on an environment not in config.environments, listing them', () => {
  expect(() =>
    getMobileShell({
      mobileConfig: { shells: [{ id: 'field' }] },
      config,
      environment: 'preview',
    })
  ).toThrow(
    'Environment "preview" is not declared in "config.environments". Environments: production, staging.'
  );
});

test('getMobileShell fails when the app declares no environments', () => {
  expect(() =>
    getMobileShell({
      mobileConfig: { shells: [{ id: 'field' }] },
      config: {},
      environment: 'production',
    })
  ).toThrow(
    'Environment "production" is not declared in "config.environments". The app declares none: add each environment with its url.'
  );
});
