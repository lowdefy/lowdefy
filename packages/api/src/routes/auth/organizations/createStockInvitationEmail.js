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

// The fallback invitation email when no "invitation.send" hook is bound:
// a stock template through auth.email. When neither is configured, sending
// an invitation fails at runtime with an error naming the fix - deliberately
// not build-checked, the same stance as password reset.
function createStockInvitationEmail({ sendEmail }) {
  return async function stockInvitationEmail({ email, organization, invitation }) {
    if (!sendEmail) {
      throw new Error(
        'Cannot send the invitation email. Bind an "invitation.send" auth hook or configure "auth.email".'
      );
    }
    await sendEmail({
      to: email,
      subject: `You have been invited to ${organization.name}`,
      text: `You have been invited to join ${organization.name}. Sign in with this email address and open the invitation page to accept. Invitation id: ${invitation.id}`,
    });
  };
}

export default createStockInvitationEmail;
