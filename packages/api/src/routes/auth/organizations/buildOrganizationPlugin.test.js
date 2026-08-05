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

import buildOrganizationPlugin from './buildOrganizationPlugin.js';

const authConfig = {
  organizations: { policy: 'pinned', org: 'default', signup: 'invite-only' },
  roles: [{ id: 'auditor' }, { id: 'branch-manager' }],
};

test('buildOrganizationPlugin constructs the organization plugin', () => {
  const plugin = buildOrganizationPlugin({
    authConfig,
    getAuth: () => ({}),
    sendInvitationEmail: async () => {},
  });
  expect(plugin.id).toBe('organization');
});

test.each(['pinned', 'tenant'])(
  'buildOrganizationPlugin registers exactly owner, admin and member under %s',
  (policy) => {
    const plugin = buildOrganizationPlugin({
      authConfig: { ...authConfig, organizations: { ...authConfig.organizations, policy } },
      getAuth: () => ({}),
      sendInvitationEmail: async () => {},
    });
    expect(Object.keys(plugin.options.roles)).toEqual(['owner', 'admin', 'member']);
    // The built-in member role keeps its plugin statements (ac: ["read"]).
    expect(plugin.options.roles.member.statements.ac).toEqual(['read']);
  }
);

test.each(['pinned', 'tenant'])(
  'buildOrganizationPlugin leaves creatorRole unset under %s',
  (policy) => {
    const plugin = buildOrganizationPlugin({
      authConfig: { ...authConfig, organizations: { ...authConfig.organizations, policy } },
      getAuth: () => ({}),
      sendInvitationEmail: async () => {},
    });
    // Left unset so the plugin defaults it to "owner".
    expect('creatorRole' in plugin.options).toBe(false);
    expect(plugin.options.creatorRole).toBeUndefined();
  }
);

test('buildOrganizationPlugin does not register the authored role catalog', () => {
  const plugin = buildOrganizationPlugin({
    authConfig,
    getAuth: () => ({}),
    sendInvitationEmail: async () => {},
  });
  expect(plugin.options.roles.auditor).toBeUndefined();
  expect(plugin.options.roles['branch-manager']).toBeUndefined();
});

test('buildOrganizationPlugin ignores a catalog role reusing a built-in name', () => {
  const plugin = buildOrganizationPlugin({
    authConfig: { ...authConfig, roles: [{ id: 'admin' }] },
    getAuth: () => ({}),
    sendInvitationEmail: async () => {},
  });
  // The catalog has no BetterAuth-side consumer, so authoring an app role named
  // after a built-in cannot narrow or widen the org-authority tier.
  expect(Object.keys(plugin.options.roles)).toEqual(['owner', 'admin', 'member']);
  expect(plugin.options.roles.admin.authorize({ member: ['create'] }).success).toBe(true);
});

test('buildOrganizationPlugin does not mention $lowdefy-system anywhere in the built plugin', () => {
  const plugin = buildOrganizationPlugin({
    authConfig: { ...authConfig, roles: [{ id: '$lowdefy-system' }] },
    getAuth: () => ({}),
    sendInvitationEmail: async () => {},
  });
  const seen = new Set();
  function walk(value) {
    if (value === null || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    Object.entries(value).forEach(([key, child]) => {
      expect(key).not.toBe('$lowdefy-system');
      expect(child).not.toBe('$lowdefy-system');
      walk(child);
    });
  }
  walk(plugin);
});

test('buildOrganizationPlugin blocks client-driven organization creation', () => {
  const plugin = buildOrganizationPlugin({
    authConfig,
    getAuth: () => ({}),
    sendInvitationEmail: async () => {},
  });
  expect(plugin.options.allowUserToCreateOrganization).toBe(false);
});

test('buildOrganizationPlugin cancels a pending invitation when the same email is re-invited', () => {
  const plugin = buildOrganizationPlugin({
    authConfig,
    getAuth: () => ({}),
    sendInvitationEmail: async () => {},
  });
  expect(plugin.options.cancelPendingInvitationsOnReInvite).toBe(true);
});

test('buildOrganizationPlugin maps the user-* collection names and internal additionalFields', () => {
  const plugin = buildOrganizationPlugin({
    authConfig,
    getAuth: () => ({}),
    sendInvitationEmail: async () => {},
  });
  expect(plugin.options.schema.organization.modelName).toBe('user-organizations');
  expect(plugin.options.schema.member.modelName).toBe('user-members');
  expect(plugin.options.schema.invitation.modelName).toBe('user-invitations');
  expect(plugin.options.schema.member.additionalFields.attributes.type).toBe('json');
  expect(plugin.options.schema.invitation.additionalFields.attributes.type).toBe('json');
  expect(plugin.options.schema.invitation.additionalFields.profile.type).toBe('json');
});

test('buildOrganizationPlugin declares member.appRoles as a request-body-excluded string array', () => {
  const plugin = buildOrganizationPlugin({
    authConfig,
    getAuth: () => ({}),
    sendInvitationEmail: async () => {},
  });
  expect(plugin.options.schema.member.additionalFields.appRoles).toEqual({
    type: 'string[]',
    required: false,
    input: false,
  });
});

test('buildOrganizationPlugin declares invitation.appRoles without input: false so the invite body keeps it', () => {
  const plugin = buildOrganizationPlugin({
    authConfig,
    getAuth: () => ({}),
    sendInvitationEmail: async () => {},
  });
  // toZodSchema strips input: false fields from the client-side
  // /organization/invite-member body, so the key must be absent - not false.
  expect(plugin.options.schema.invitation.additionalFields.appRoles).toEqual({
    type: 'string[]',
    required: false,
  });
  expect('input' in plugin.options.schema.invitation.additionalFields.appRoles).toBe(false);
});
