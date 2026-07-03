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

import createStockInvitationEmail from './createStockInvitationEmail.js';

test('stockInvitationEmail throws naming both fixes when no sendEmail is configured', async () => {
  const stockInvitationEmail = createStockInvitationEmail({ sendEmail: undefined });

  await expect(
    stockInvitationEmail({
      email: 'invitee@example.com',
      organization: { id: 'org_1', name: 'Acme' },
      invitation: { id: 'inv_1' },
    })
  ).rejects.toThrow(
    'Cannot send the invitation email. Bind an "invitation.send" auth hook or configure "auth.email".'
  );
});

test('stockInvitationEmail sends the stock template through sendEmail when auth.email is configured', async () => {
  const sendEmail = jest.fn().mockResolvedValue();
  const stockInvitationEmail = createStockInvitationEmail({ sendEmail });

  await stockInvitationEmail({
    email: 'invitee@example.com',
    organization: { id: 'org_1', name: 'Acme' },
    invitation: { id: 'inv_1' },
  });

  expect(sendEmail).toHaveBeenCalledWith({
    to: 'invitee@example.com',
    subject: 'You have been invited to Acme',
    text: expect.stringContaining('inv_1'),
  });
});
