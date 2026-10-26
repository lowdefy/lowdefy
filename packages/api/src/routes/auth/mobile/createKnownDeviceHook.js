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

import getKnownDeviceIdentifier from './getKnownDeviceIdentifier.js';
import readDeviceKeyHash from './readDeviceKeyHash.js';

const KNOWN_DEVICE_SECONDS = 90 * 24 * 60 * 60;

// session.create.before, bound for apps with a mobile section: a phone that
// signs in natively by email code, sending its device key, is recorded as
// known for that address for 90 days, so createEmailSendLimit lets it past the
// address's send cap. The code it signed in with proves it can read the
// address's email. Changes nothing about the session.
function createKnownDeviceHook({ getAuth }) {
  return async function knownDevice(session, ctx) {
    if (ctx?.path !== '/sign-in/email-otp') {
      return undefined;
    }
    const deviceKeyHash = readDeviceKeyHash({ request: ctx.request });
    const rawEmail = ctx.body?.email;
    if (deviceKeyHash === null || !type.isString(rawEmail)) {
      return undefined;
    }
    const identifier = getKnownDeviceIdentifier({
      deviceKeyHash,
      email: rawEmail.trim().toLowerCase(),
    });
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
    return undefined;
  };
}

export default createKnownDeviceHook;
