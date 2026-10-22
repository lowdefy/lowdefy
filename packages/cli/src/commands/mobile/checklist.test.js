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

const mockLoadMobileShell = jest.fn();
jest.unstable_mockModule('./loadMobileShell.js', () => ({ default: mockLoadMobileShell }));

const { default: createChecklist } = await import('./createChecklist.js');
const { default: mobileChecklist } = await import('./checklist.js');

// As @lowdefy/shell's resolveProfile returns them (profiles.js).
const BASIC = {
  name: 'basic',
  dataCollected: [
    { type: 'emailAddress', purpose: 'appFunctionality' },
    { type: 'userId', purpose: 'appFunctionality' },
  ],
};
const FIELD = {
  name: 'field',
  dataCollected: [...BASIC.dataCollected, { type: 'photos', purpose: 'appFunctionality' }],
};
const FIELD_TRACKING = { ...FIELD, name: 'field-tracking' };

function createShell(overrides = {}) {
  return {
    id: 'field',
    name: 'Field',
    profile: 'field',
    distribution: 'private',
    eas: { owner: 'example', projectId: 'p1' },
    ios: { bundleId: 'com.example.field', teamId: 'ABCDE12345', ascAppId: '6825509768' },
    android: { package: 'com.example.field' },
    ...overrides,
  };
}

function stepIds(steps) {
  return steps.map((step) => step.id);
}

function getStep(steps, id) {
  return steps.find((step) => step.id === id);
}

test('a private shell has every step, in the design order', () => {
  const steps = createChecklist({ shell: createShell(), profile: FIELD, env: 'production' });
  expect(stepIds(steps)).toEqual([
    'store-records',
    'first-build',
    'private-distribution',
    'android-signing-key',
    'privacy',
    'review-and-promote',
  ]);
});

test('an internal shell has no private distribution or review step', () => {
  const steps = createChecklist({
    shell: createShell({ distribution: 'internal' }),
    profile: FIELD,
    env: 'production',
  });
  expect(stepIds(steps)).toEqual([
    'store-records',
    'first-build',
    'android-signing-key',
    'privacy',
  ]);
});

test('a store shell is reviewed and promoted but not made private', () => {
  const steps = createChecklist({
    shell: createShell({ distribution: 'store' }),
    profile: FIELD,
    env: 'production',
  });
  expect(stepIds(steps)).not.toContain('private-distribution');
  expect(stepIds(steps)).toContain('review-and-promote');
});

test("the steps carry the shell's own values", () => {
  const steps = createChecklist({ shell: createShell(), profile: FIELD, env: 'staging' });
  const text = JSON.stringify(steps);
  ['com.example.field', 'ABCDE12345', '6825509768', 'example', 'p1'].forEach((value) => {
    expect(text).toContain(value);
  });
  expect(getStep(steps, 'first-build').details[0]).toContain(
    'lowdefy mobile build --shell field --env staging'
  );
});

test('a value the shell does not set is named as missing', () => {
  const steps = createChecklist({
    shell: createShell({ ios: undefined }),
    profile: FIELD,
    env: 'production',
  });
  expect(getStep(steps, 'store-records').details[0]).toContain('<ios.bundleId not set>');
  expect(getStep(steps, 'store-records').details[1]).toContain('<ios.ascAppId not set>');
});

test('the signing key step is done once android.sha256 is set', () => {
  const open = createChecklist({ shell: createShell(), profile: FIELD, env: 'production' });
  expect(getStep(open, 'android-signing-key').done).toBe(false);
  const done = createChecklist({
    shell: createShell({ android: { package: 'com.example.field', sha256: ['AA:BB'] } }),
    profile: FIELD,
    env: 'production',
  });
  expect(getStep(done, 'android-signing-key').done).toBe(true);
  expect(stepIds(done).filter((id) => getStep(done, id).done)).toEqual(['android-signing-key']);
});

test('the privacy answers come from the profile', () => {
  const basic = getStep(
    createChecklist({
      shell: createShell({ profile: 'basic' }),
      profile: BASIC,
      env: 'production',
    }),
    'privacy'
  );
  const field = getStep(
    createChecklist({ shell: createShell(), profile: FIELD, env: 'production' }),
    'privacy'
  );
  expect(basic.details).not.toEqual(field.details);
  expect(field.details).toContain(
    'Photos or videos: collected, linked to the user, for app functionality.'
  );
  expect(basic.details.join('\n')).not.toContain('Photos');
  expect(basic.details).toContain(
    'Email address: collected, linked to the user, for app functionality.'
  );
});

test('field-tracking adds the background-location declaration and basic does not', () => {
  const tracking = getStep(
    createChecklist({ shell: createShell(), profile: FIELD_TRACKING, env: 'production' }),
    'privacy'
  );
  const basic = getStep(
    createChecklist({ shell: createShell(), profile: BASIC, env: 'production' }),
    'privacy'
  );
  expect(tracking.details.join('\n')).toContain('Background location');
  expect(basic.details.join('\n')).not.toContain('Background location');
});

test('lowdefy mobile checklist prints numbered steps with the shell values', async () => {
  const shell = createShell({ android: { package: 'com.example.field', sha256: ['AA'] } });
  mockLoadMobileShell.mockResolvedValue({ environment: 'production', profile: FIELD, shell });
  const context = { logger: { info: jest.fn() }, options: { env: 'production' } };
  const steps = await mobileChecklist({ context });
  expect(steps).toHaveLength(6);
  const [output] = context.logger.info.mock.calls[0];
  expect(output).toMatch(/^Steps a person does for shell "field" \(private, production\):/);
  expect(output).toContain('\n1. Create the App Store Connect record and the Play Console app.');
  expect(output).toContain('\n4. [done] Copy the Play app signing key');
  expect(output).toContain('\n6. For each native release, submit for review and promote.');
  expect(output).toContain('com.example.field');
  expect(output).toContain('SENTRY_AUTH_TOKEN');
});
