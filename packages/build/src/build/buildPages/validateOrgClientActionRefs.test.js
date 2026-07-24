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
  expect(ORG_CLIENT_ACTION_TYPES).toEqual([
    'CancelInvitation',
    'InviteMember',
    'LeaveOrganization',
    'RemoveMember',
    'SetActiveOrganization',
    'UpdateMemberRole',
    'UpdateOrganization',
  ]);
});

test.each(ORG_CLIENT_ACTION_TYPES)(
  'validateOrgClientActionRefs throws a ConfigError under pinned naming %s, page, and policy',
  (actionType) => {
    const orgClientActionRefs = [makeRef(actionType)];
    let thrown;
    try {
      validateOrgClientActionRefs({ orgClientActionRefs, policy: 'pinned' });
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(ConfigError);
    expect(thrown.message).toBe(
      `${actionType} action on page "page1" is not allowed under the "pinned" organizations policy - the per-organization client endpoints are disabled for a pinned deployment.`
    );
    expect(thrown.configKey).toBe('pages.page1.events.onClick.0');
  }
);

test('validateOrgClientActionRefs throws on the first ref when multiple are wired under pinned', () => {
  const first = makeRef('InviteMember');
  const second = makeRef('RemoveMember');
  second.sourcePageId = 'page2';
  second.action['~k'] = 'pages.page2.events.onClick.0';
  let thrown;
  try {
    validateOrgClientActionRefs({ orgClientActionRefs: [first, second], policy: 'pinned' });
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(ConfigError);
  expect(thrown.message).toContain('InviteMember action on page "page1"');
  expect(thrown.configKey).toBe('pages.page1.events.onClick.0');
});

test('validateOrgClientActionRefs is a no-op under the tenant policy', () => {
  const orgClientActionRefs = ORG_CLIENT_ACTION_TYPES.map((actionType) => makeRef(actionType));
  expect(() =>
    validateOrgClientActionRefs({ orgClientActionRefs, policy: 'tenant' })
  ).not.toThrow();
});

test('validateOrgClientActionRefs is a no-op for any non-pinned policy', () => {
  const orgClientActionRefs = [makeRef()];
  expect(() =>
    validateOrgClientActionRefs({ orgClientActionRefs, policy: 'something-else' })
  ).not.toThrow();
});

test('validateOrgClientActionRefs is a no-op when no refs are collected under pinned', () => {
  expect(() =>
    validateOrgClientActionRefs({ orgClientActionRefs: [], policy: 'pinned' })
  ).not.toThrow();
});
