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

import getCodeHolderIdentifier from '../mobile/getCodeHolderIdentifier.js';

// An address has one live sign-in code, and a few wrong tries at it kill it. So
// a known phone that asks for the code holds it: until the code expires only
// that phone may try it (createEmailCodeHolderGate), and a stranger cannot kill
// it with wrong tries. Codes are resent rather than replaced (resendStrategy
// reuse), so another send keeps the same code and moves its expiry on; the hold
// moves with it.
async function holdEmailCode({ adapter, codeSeconds, deviceKeyHash, email, known, now }) {
  const identifier = getCodeHolderIdentifier({ email });
  const expiresAt = new Date(now.getTime() + codeSeconds * 1000);
  if (known) {
    await adapter.deleteMany({
      model: 'verification',
      where: [{ field: 'identifier', value: identifier }],
    });
    await adapter.create({
      model: 'verification',
      data: { identifier, value: deviceKeyHash, expiresAt, createdAt: now, updatedAt: now },
    });
    return;
  }
  const hold = await adapter.findOne({
    model: 'verification',
    where: [
      { field: 'identifier', value: identifier },
      { field: 'expiresAt', operator: 'gt', value: now },
    ],
  });
  if (hold === null) {
    return;
  }
  await adapter.update({
    model: 'verification',
    where: [{ field: 'id', value: hold.id }],
    update: { expiresAt, updatedAt: now },
  });
}

export default holdEmailCode;
