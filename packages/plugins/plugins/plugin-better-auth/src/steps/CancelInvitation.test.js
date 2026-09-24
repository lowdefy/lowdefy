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

import CancelInvitation from './CancelInvitation.js';
import createMockAuth from '../../test/createMockAuth.js';

const acting = { system: true, user: null };

test('CancelInvitation passes invitationId through as body to the org cancelInvitation endpoint', async () => {
  const cancelInvitation = jest.fn().mockResolvedValue({ id: 'invitation-1', status: 'canceled' });
  const { auth } = createMockAuth({ organizationEndpoints: { cancelInvitation } });
  const result = await CancelInvitation({
    acting,
    auth,
    properties: { invitationId: 'invitation-1' },
  });
  expect(result).toEqual({ id: 'invitation-1', status: 'canceled' });
  expect(cancelInvitation.mock.calls[0][0].body).toEqual({ invitationId: 'invitation-1' });
});

test('CancelInvitation throws when invitationId property is missing', async () => {
  const { auth } = createMockAuth();
  await expect(CancelInvitation({ acting, auth, properties: {} })).rejects.toThrow(
    'CancelInvitation requires an "invitationId" property.'
  );
});
