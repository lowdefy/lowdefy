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

import getKnownDeviceIdentifier from '../mobile/getKnownDeviceIdentifier.js';
import holdEmailCode from './holdEmailCode.js';
import readDeviceKeyHash from '../mobile/readDeviceKeyHash.js';
import reserveSendSlot from './reserveSendSlot.js';

const IDENTIFIER_PREFIX = 'email-send-limit:';

// The engine-tier request hooks.before that caps how many codes are sent: max
// per windowSeconds, counted in the auth database's verification records so
// every server instance shares the count. BetterAuth's own rate limiter counts
// per client address and per instance, which a phone network's shared
// addresses and several instances both defeat.
//
// A per-address cap alone lets anyone who knows an address keep its person
// out of code sign-in. So a phone that sends its device key (a secret only it
// holds, x-lowdefy-device-key) counts against its own cap for the address,
// and a phone that has signed in with the address before (createKnownDeviceHook)
// skips the address's cap. Every other send - a browser, a new phone, a guess
// at a key - counts against the address's cap. A known phone's sign-in code is
// then held for it (holdEmailCode), so a stranger can neither replace the code
// nor use it up with wrong tries.
//
// Registered ahead of the send gate, so an address the app would not mail
// counts and is refused the same way as one it would: the refusal never tells
// whether an account exists. A refused send keeps no slot, so the window runs
// from the sends that went through.
function createEmailSendLimit({ codeSeconds, getAuth, max, windowSeconds }) {
  return async function emailSendLimit(ctx) {
    const rawEmail = ctx.body?.email;
    // No email is the route's own validation error.
    if (!type.isString(rawEmail)) {
      return undefined;
    }
    const email = rawEmail.trim().toLowerCase();
    const deviceKeyHash = readDeviceKeyHash({ request: ctx.request });
    const { adapter } = await getAuth().$context;
    const now = new Date();
    const identifiers = [];
    if (deviceKeyHash !== null) {
      identifiers.push(`${IDENTIFIER_PREFIX}${email}:${deviceKeyHash}`);
    }
    const known =
      deviceKeyHash !== null &&
      (await adapter.count({
        model: 'verification',
        where: [
          { field: 'identifier', value: getKnownDeviceIdentifier({ deviceKeyHash, email }) },
          { field: 'expiresAt', operator: 'gt', value: now },
        ],
      })) > 0;
    if (!known) {
      identifiers.push(`${IDENTIFIER_PREFIX}${email}`);
    }
    const taken = [];
    for (const identifier of identifiers) {
      const record = await reserveSendSlot({ adapter, identifier, max, now, windowSeconds });
      if (record === null) {
        await Promise.all(
          taken.map(({ id }) =>
            adapter.delete({ model: 'verification', where: [{ field: 'id', value: id }] })
          )
        );
        throw new APIError('TOO_MANY_REQUESTS', {
          message: 'Too many sign-in codes were requested for this email. Try again later.',
        });
      }
      taken.push(record);
    }
    if (ctx.path === '/email-otp/send-verification-otp' && ctx.body?.type === 'sign-in') {
      await holdEmailCode({ adapter, codeSeconds, deviceKeyHash, email, known, now });
    }
    return undefined;
  };
}

export default createEmailSendLimit;
