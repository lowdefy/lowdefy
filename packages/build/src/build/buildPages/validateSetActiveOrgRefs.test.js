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

import { ConfigError } from '@lowdefy/errors';

import validateSetActiveOrgRefs from './validateSetActiveOrgRefs.js';

const makeRef = () => ({
  action: {
    id: 'set_active_1',
    type: 'SetActiveOrganization',
    '~k': 'pages.page1.events.onClick.0',
  },
  blockId: 'block_1',
  eventId: 'onClick',
  sourcePageId: 'page1',
});

test('validateSetActiveOrgRefs throws a ConfigError under pinned naming action, page, and policy', () => {
  const setActiveOrgActionRefs = [makeRef()];
  let thrown;
  try {
    validateSetActiveOrgRefs({ setActiveOrgActionRefs, policy: 'pinned' });
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(ConfigError);
  expect(thrown.message).toBe(
    'SetActiveOrganization action on page "page1" is not allowed under the "pinned" organizations policy - the active organization is fixed for a pinned deployment.'
  );
  expect(thrown.configKey).toBe('pages.page1.events.onClick.0');
});

test('validateSetActiveOrgRefs throws on the first ref when multiple are wired under pinned', () => {
  const first = makeRef();
  const second = makeRef();
  second.sourcePageId = 'page2';
  second.action['~k'] = 'pages.page2.events.onClick.0';
  let thrown;
  try {
    validateSetActiveOrgRefs({ setActiveOrgActionRefs: [first, second], policy: 'pinned' });
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(ConfigError);
  expect(thrown.message).toContain('page "page1"');
  expect(thrown.configKey).toBe('pages.page1.events.onClick.0');
});

test('validateSetActiveOrgRefs is a no-op under the tenant policy', () => {
  const setActiveOrgActionRefs = [makeRef()];
  expect(() =>
    validateSetActiveOrgRefs({ setActiveOrgActionRefs, policy: 'tenant' })
  ).not.toThrow();
});

test('validateSetActiveOrgRefs is a no-op for any non-pinned policy', () => {
  const setActiveOrgActionRefs = [makeRef()];
  expect(() =>
    validateSetActiveOrgRefs({ setActiveOrgActionRefs, policy: 'something-else' })
  ).not.toThrow();
});

test('validateSetActiveOrgRefs is a no-op when no refs are collected under pinned', () => {
  expect(() =>
    validateSetActiveOrgRefs({ setActiveOrgActionRefs: [], policy: 'pinned' })
  ).not.toThrow();
});
