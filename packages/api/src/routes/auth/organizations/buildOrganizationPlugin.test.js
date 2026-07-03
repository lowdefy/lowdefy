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
  roles: ['auditor', 'branch-manager'],
};

test('buildOrganizationPlugin constructs the organization plugin', () => {
  const plugin = buildOrganizationPlugin({
    authConfig,
    getAuth: () => ({}),
    sendInvitationEmail: async () => {},
  });
  expect(plugin.id).toBe('organization');
});

test('buildOrganizationPlugin registers catalog roles alongside the built-in roles', () => {
  const plugin = buildOrganizationPlugin({
    authConfig,
    getAuth: () => ({}),
    sendInvitationEmail: async () => {},
  });
  // The plugin exposes its resolved options; the roles map drives which role
  // names the member APIs accept.
  expect(Object.keys(plugin.options.roles).sort()).toEqual([
    'admin',
    'auditor',
    'branch-manager',
    'member',
    'owner',
  ]);
});

test('buildOrganizationPlugin keeps the built-in role statements when the catalog reuses a name', () => {
  const plugin = buildOrganizationPlugin({
    authConfig: { ...authConfig, roles: ['member', 'auditor'] },
    getAuth: () => ({}),
    sendInvitationEmail: async () => {},
  });
  // The built-in member role keeps its plugin statements (ac: ["read"]),
  // while the catalog-only auditor role registers with empty statements.
  expect(plugin.options.roles.member.statements.ac).toEqual(['read']);
  expect(plugin.options.roles.auditor.statements).toEqual({});
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
  expect(plugin.options.schema.invitation.additionalFields.contactId.type).toBe('string');
});
