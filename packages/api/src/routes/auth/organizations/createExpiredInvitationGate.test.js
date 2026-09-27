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

import createExpiredInvitationGate from './createExpiredInvitationGate.js';

const past = new Date(Date.now() - 1000).toISOString();
const future = new Date(Date.now() + 3600 * 1000).toISOString();

function createGate(invitation) {
  const adapter = { findOne: jest.fn(async () => invitation) };
  const auth = { $context: Promise.resolve({ adapter }) };
  return { gate: createExpiredInvitationGate({ getAuth: () => auth }), adapter };
}

test.each([
  ['a pending invitation past its expiry', { status: 'pending', expiresAt: past }],
  ['a cancelled invitation', { status: 'canceled', expiresAt: future }],
  ['a rejected invitation', { status: 'rejected', expiresAt: future }],
])('createExpiredInvitationGate answers INVITATION_EXPIRED for %s', async (_, invitation) => {
  const { gate, adapter } = createGate({ id: 'inv_1', ...invitation });

  const error = await gate({ body: { invitationId: 'inv_1' } }).catch((caught) => caught);

  expect(adapter.findOne).toHaveBeenCalledWith({
    model: 'invitation',
    where: [{ field: 'id', value: 'inv_1' }],
  });
  expect(error.status).toBe('BAD_REQUEST');
  expect(error.body).toMatchObject({
    code: 'INVITATION_EXPIRED',
    message: 'This invitation has expired. Ask the person who invited you to send a new one.',
  });
});

test.each([
  ['a pending invitation before its expiry', { id: 'inv_1', status: 'pending', expiresAt: future }],
  // Already accepted, or never existed: BetterAuth's own answer stands.
  ['an accepted invitation', { id: 'inv_1', status: 'accepted', expiresAt: past }],
  ['an unknown invitation id', null],
])('createExpiredInvitationGate lets BetterAuth answer %s', async (_, invitation) => {
  const { gate } = createGate(invitation);

  expect(await gate({ body: { invitationId: 'inv_1' } })).toBeUndefined();
});

test('createExpiredInvitationGate leaves a request without an invitation id to the route', async () => {
  const getAuth = jest.fn();
  const gate = createExpiredInvitationGate({ getAuth });

  expect(await gate({ body: {} })).toBeUndefined();
  expect(getAuth).not.toHaveBeenCalled();
});
