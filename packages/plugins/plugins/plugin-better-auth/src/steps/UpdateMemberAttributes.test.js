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

import UpdateMemberAttributes from './UpdateMemberAttributes.js';
import createMockAuth from '../../test/createMockAuth.js';

// The step floor resolves the target organization and passes the id in; the
// defaulting and tenant-policy rules are tested there, not here.
const organizationId = 'org-1';

test('UpdateMemberAttributes updates the member row directly through the adapter, scoped to the resolved organization', async () => {
  const updated = { id: 'member-1', attributes: { region: 'eu' } };
  const adapter = { update: jest.fn().mockResolvedValue(updated) };
  const { auth } = createMockAuth({ adapter });
  const result = await UpdateMemberAttributes({
    auth,
    organizationId,
    properties: { memberId: 'member-1', attributes: { region: 'eu' } },
  });
  expect(result).toEqual(updated);
  expect(adapter.update).toHaveBeenCalledWith({
    model: 'member',
    where: [
      { field: 'id', value: 'member-1' },
      { field: 'organizationId', value: 'org-1' },
    ],
    update: { attributes: { region: 'eu' } },
  });
});

test('UpdateMemberAttributes throws when no member matches the memberId within the resolved organization', async () => {
  const adapter = { update: jest.fn().mockResolvedValue(null) };
  const { auth } = createMockAuth({ adapter });
  await expect(
    UpdateMemberAttributes({
      auth,
      organizationId,
      properties: { memberId: 'member-1', attributes: { region: 'eu' } },
    })
  ).rejects.toThrow('UpdateMemberAttributes found no member "member-1" in organization "org-1".');
});

test('UpdateMemberAttributes throws when memberId property is missing', async () => {
  const { auth } = createMockAuth();
  await expect(
    UpdateMemberAttributes({ auth, organizationId, properties: { attributes: {} } })
  ).rejects.toThrow('UpdateMemberAttributes requires a "memberId" property.');
});

test('UpdateMemberAttributes throws when attributes is not a plain object', async () => {
  const { auth } = createMockAuth();
  await expect(
    UpdateMemberAttributes({
      auth,
      organizationId,
      properties: { memberId: 'member-1', attributes: null },
    })
  ).rejects.toThrow('UpdateMemberAttributes requires an "attributes" object. Received null.');
});
