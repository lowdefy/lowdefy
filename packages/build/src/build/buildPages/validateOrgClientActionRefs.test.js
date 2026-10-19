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

import validateOrgClientActionRefs, {
  ORG_CLIENT_ACTION_TYPES,
} from './validateOrgClientActionRefs.js';

const makeRef = (actionType = 'SetActiveOrganization') => ({
  action: {
    id: 'org_action_1',
    type: actionType,
    '~k': 'pages.page1.events.onClick.0',
  },
  blockId: 'block_1',
  eventId: 'onClick',
  sourcePageId: 'page1',
});

test('ORG_CLIENT_ACTION_TYPES covers all per-org client actions', () => {
  expect(ORG_CLIENT_ACTION_TYPES).toEqual(['LeaveOrganization', 'SetActiveOrganization']);
});

test.each(ORG_CLIENT_ACTION_TYPES)(
  'validateOrgClientActionRefs collects a ConfigError under pinned naming %s, page, and policy',
  (actionType) => {
    const context = { errors: [] };
    validateOrgClientActionRefs({
      orgClientActionRefs: [makeRef(actionType)],
      policy: 'pinned',
      context,
    });
    expect(context.errors.length).toBe(1);
    expect(context.errors[0]).toBeInstanceOf(ConfigError);
    expect(context.errors[0].message).toBe(
      `${actionType} action on page "page1" is not allowed under the "pinned" organizations policy - the per-organization client endpoints are disabled for a pinned deployment.`
    );
    expect(context.errors[0].configKey).toBe('pages.page1.events.onClick.0');
  }
);

test('validateOrgClientActionRefs collects an error for every ref wired under pinned', () => {
  const first = makeRef('SetActiveOrganization');
  const second = makeRef('LeaveOrganization');
  second.sourcePageId = 'page2';
  second.action['~k'] = 'pages.page2.events.onClick.0';
  const context = { errors: [] };
  validateOrgClientActionRefs({ orgClientActionRefs: [first, second], policy: 'pinned', context });
  expect(context.errors.length).toBe(2);
  expect(context.errors[0].message).toContain('SetActiveOrganization action on page "page1"');
  expect(context.errors[0].configKey).toBe('pages.page1.events.onClick.0');
  expect(context.errors[1].message).toContain('LeaveOrganization action on page "page2"');
  expect(context.errors[1].configKey).toBe('pages.page2.events.onClick.0');
});

test('validateOrgClientActionRefs is a no-op under the tenant policy', () => {
  const orgClientActionRefs = ORG_CLIENT_ACTION_TYPES.map((actionType) => makeRef(actionType));
  const context = { errors: [] };
  validateOrgClientActionRefs({ orgClientActionRefs, policy: 'tenant', context });
  expect(context.errors).toEqual([]);
});

test('validateOrgClientActionRefs is a no-op for any non-pinned policy', () => {
  const context = { errors: [] };
  validateOrgClientActionRefs({
    orgClientActionRefs: [makeRef()],
    policy: 'something-else',
    context,
  });
  expect(context.errors).toEqual([]);
});

test('validateOrgClientActionRefs is a no-op when no refs are collected under pinned', () => {
  const context = { errors: [] };
  validateOrgClientActionRefs({ orgClientActionRefs: [], policy: 'pinned', context });
  expect(context.errors).toEqual([]);
});
