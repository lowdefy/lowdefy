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

import getCodeHolderIdentifier from '../mobile/getCodeHolderIdentifier.js';
import readDeviceKeyHash from '../mobile/readDeviceKeyHash.js';

// The engine-tier request hooks.before on /sign-in/email-otp for apps with a
// mobile section. While a known phone holds the address's live code
// (holdEmailCode), a try from anything else is refused before BetterAuth counts
// it as a wrong attempt, so nobody but that phone can use up the code. It is
// refused as BetterAuth refuses a wrong code, so it says nothing about the hold.
function createEmailCodeHolderGate({ getAuth }) {
  return async function emailCodeHolderGate(ctx) {
    const rawEmail = ctx.body?.email;
    if (!type.isString(rawEmail)) {
      return undefined;
    }
    const { adapter } = await getAuth().$context;
    const hold = await adapter.findOne({
      model: 'verification',
      where: [
        {
          field: 'identifier',
          value: getCodeHolderIdentifier({ email: rawEmail.trim().toLowerCase() }),
        },
        { field: 'expiresAt', operator: 'gt', value: new Date() },
      ],
    });
    if (hold === null || readDeviceKeyHash({ request: ctx.request }) === hold.value) {
      return undefined;
    }
    throw new APIError('BAD_REQUEST', { code: 'INVALID_OTP', message: 'Invalid OTP' });
  };
}

export default createEmailCodeHolderGate;
