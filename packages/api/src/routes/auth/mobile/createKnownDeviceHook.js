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

import getCodeHolderIdentifier from './getCodeHolderIdentifier.js';
import getKnownDeviceIdentifier from './getKnownDeviceIdentifier.js';
import readDeviceKeyHash from './readDeviceKeyHash.js';

const KNOWN_DEVICE_SECONDS = 90 * 24 * 60 * 60;

// The engine-tier request hooks.after on /sign-in/email-otp for apps with a
// mobile section, registered after the two-factor challenge: a phone that
// signed in by code, sending its device key, is recorded as known for the
// address for 90 days, so createEmailSendLimit lets it past the address's send
// cap. It runs only when the request created a session and no second factor
// stopped it (the challenge answers first and ends the slot). The code is used,
// so its hold goes too.
function createKnownDeviceHook({ getAuth }) {
  return async function knownDevice(ctx) {
    const rawEmail = ctx.body?.email;
    const deviceKeyHash = readDeviceKeyHash({ request: ctx.request });
    if (type.isNone(ctx.context.newSession) || deviceKeyHash === null || !type.isString(rawEmail)) {
      return undefined;
    }
    const email = rawEmail.trim().toLowerCase();
    const identifier = getKnownDeviceIdentifier({ deviceKeyHash, email });
    const { adapter } = await getAuth().$context;
    const now = new Date();
    await adapter.deleteMany({
      model: 'verification',
      where: [{ field: 'identifier', value: identifier }],
    });
    await adapter.create({
      model: 'verification',
      data: {
        identifier,
        value: 'known',
        expiresAt: new Date(now.getTime() + KNOWN_DEVICE_SECONDS * 1000),
        createdAt: now,
        updatedAt: now,
      },
    });
    await adapter.deleteMany({
      model: 'verification',
      where: [{ field: 'identifier', value: getCodeHolderIdentifier({ email }) }],
    });
    return undefined;
  };
}

export default createKnownDeviceHook;
