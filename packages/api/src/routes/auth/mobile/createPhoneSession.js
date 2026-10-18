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

import { type } from '@lowdefy/helpers';

import getMobileSessionExpiry from './getMobileSessionExpiry.js';

// A new session for the phone, for the person signed in to the sheet's
// browser. The browser's own session is never handed to the phone, so the
// phone and the browser (Chrome, on Android) never share a token, and signing
// out on one leaves the other signed in.
//
// - It carries the browser session's active organization: the organization
//   policy hook (session.create.before) picks the oldest membership, so a
//   person who switched organization in the browser is set back to theirs.
// - With mobile.auth.sessionExpiresIn it is marked mobile and given the phone
//   lifetime, as a session made by native sign-in is.
//
// Throws BetterAuth's APIError when the organization policy refuses the person.
async function createPhoneSession({ auth, authJson, browserSession, request }) {
  const { adapter, internalAdapter } = await auth.$context;
  const override = { userAgent: request.headers.get('user-agent') ?? '' };
  const { sessionExpiresIn } = authJson.mobile;
  if (type.isNumber(sessionExpiresIn)) {
    override.mobile = true;
    override.expiresAt = getMobileSessionExpiry({ sessionExpiresIn });
  }
  const session = await internalAdapter.createSession(
    browserSession.session.userId,
    false,
    override,
    true
  );
  const { activeOrganizationId } = browserSession.session;
  if (!type.isNone(activeOrganizationId) && session.activeOrganizationId !== activeOrganizationId) {
    await adapter.update({
      model: 'session',
      where: [{ field: 'id', value: session.id }],
      update: { activeOrganizationId },
    });
  }
  return session;
}

export default createPhoneSession;
