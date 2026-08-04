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

test('buildOrganizationPlugin reads role.id from the authored catalog entries', () => {
  const plugin = buildOrganizationPlugin({
    authConfig,
    getAuth: () => ({}),
    sendInvitationEmail: async () => {},
  });
  // The catalog is a list of { id, label, description }; the id is the role
  // string the member APIs accept, registered with empty statements.
  expect(plugin.options.roles.auditor.statements).toEqual({});
  expect(plugin.options.roles['branch-manager'].statements).toEqual({});
});

test('buildOrganizationPlugin registers the reserved $lowdefy-system authority role under pinned', () => {
  const plugin = buildOrganizationPlugin({
    authConfig,
    getAuth: () => ({}),
    sendInvitationEmail: async () => {},
  });
  expect(plugin.options.roles['$lowdefy-system'].statements).toEqual({
    member: ['create', 'update', 'delete'],
    invitation: ['create', 'cancel'],
    organization: ['update', 'delete'],
  });
});

test('buildOrganizationPlugin does not pass the built-in roles under pinned', () => {
  const plugin = buildOrganizationPlugin({
    authConfig,
    getAuth: () => ({}),
    sendInvitationEmail: async () => {},
  });
  // Only the authored catalog plus the reserved authority role are registered -
  // owner/admin/member are not merged in, so they carry no org-admin power.
  expect(Object.keys(plugin.options.roles).sort()).toEqual([
    '$lowdefy-system',
    'auditor',
    'branch-manager',
  ]);
});

test('buildOrganizationPlugin sets creatorRole to $lowdefy-system under pinned', () => {
  const plugin = buildOrganizationPlugin({
    authConfig,
    getAuth: () => ({}),
    sendInvitationEmail: async () => {},
  });
  expect(plugin.options.creatorRole).toBe('$lowdefy-system');
});

test('buildOrganizationPlugin leaves a catalog role reusing a built-in name with empty statements under pinned', () => {
  const plugin = buildOrganizationPlugin({
    authConfig: { ...authConfig, roles: [{ id: 'owner' }, { id: 'auditor' }] },
    getAuth: () => ({}),
    sendInvitationEmail: async () => {},
  });
  // Under pinned a catalog role named "owner" authorizes nothing at the AC
  // layer, and is not the creator (that is the reserved role).
  expect(plugin.options.roles.owner.statements).toEqual({});
  expect(plugin.options.creatorRole).toBe('$lowdefy-system');
});

test('buildOrganizationPlugin passes the built-in roles and registers $lowdefy-system under tenant', () => {
  const plugin = buildOrganizationPlugin({
    authConfig: { ...authConfig, organizations: { ...authConfig.organizations, policy: 'tenant' } },
    getAuth: () => ({}),
    sendInvitationEmail: async () => {},
  });
  expect(Object.keys(plugin.options.roles).sort()).toEqual([
    '$lowdefy-system',
    'admin',
    'auditor',
    'branch-manager',
    'member',
    'owner',
  ]);
  // The built-in member role keeps its plugin statements (ac: ["read"]).
  expect(plugin.options.roles.member.statements.ac).toEqual(['read']);
  expect(plugin.options.roles['$lowdefy-system'].statements).toEqual({
    member: ['create', 'update', 'delete'],
    invitation: ['create', 'cancel'],
    organization: ['update', 'delete'],
  });
});

test('buildOrganizationPlugin does not override creatorRole under tenant', () => {
  const plugin = buildOrganizationPlugin({
    authConfig: { ...authConfig, organizations: { ...authConfig.organizations, policy: 'tenant' } },
    getAuth: () => ({}),
    sendInvitationEmail: async () => {},
  });
  // Left unset so the plugin defaults it to "owner" (last-owner protection
  // keys on the owner creator under tenant).
  expect(plugin.options.creatorRole).toBeUndefined();
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
