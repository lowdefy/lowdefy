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

import { APIError } from 'better-auth/api';
import { type } from '@lowdefy/helpers';

const IDENTIFIER_PREFIX = 'email-send-limit:';

// The engine-tier request hooks.before that caps how many codes one address
// can be sent: max sends per windowSeconds, counted in the auth database's
// verification records so every server instance shares the count. BetterAuth's
// own rate limiter counts per client address and per instance, which a phone
// network's shared addresses and several instances both defeat.
//
// Registered ahead of the send gate, so an address the app would not mail
// counts and is refused the same way as one it would: the refusal never tells
// whether an account exists. A refused send records nothing, so the window
// runs from the sends that went through.
function createEmailSendLimit({ getAuth, max, windowSeconds }) {
  return async function emailSendLimit(ctx) {
    const email = ctx.body?.email;
    // No email is the route's own validation error.
    if (!type.isString(email)) {
      return undefined;
    }
    const identifier = `${IDENTIFIER_PREFIX}${email.trim().toLowerCase()}`;
    const { adapter } = await getAuth().$context;
    const now = new Date();
    await adapter.deleteMany({
      model: 'verification',
      where: [
        { field: 'identifier', value: identifier },
        { field: 'expiresAt', operator: 'lt', value: now },
      ],
    });
    const sent = await adapter.count({
      model: 'verification',
      where: [{ field: 'identifier', value: identifier }],
    });
    if (sent >= max) {
      throw new APIError('TOO_MANY_REQUESTS', {
        message: 'Too many sign-in codes were requested for this email. Try again later.',
      });
    }
    await adapter.create({
      model: 'verification',
      data: {
        identifier,
        value: 'sent',
        expiresAt: new Date(now.getTime() + windowSeconds * 1000),
        createdAt: now,
        updatedAt: now,
      },
    });
    return undefined;
  };
}

export default createEmailSendLimit;
