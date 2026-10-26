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

// Takes one of max send slots under an identifier, in the auth database's
// verification records so every server instance shares the count. The record
// is written first and the count read after, so parallel sends never get more
// than max slots between them: one that counts past max takes its record back
// and is refused. Records expire windowSeconds after their send.
//
// Returns the record taken, or null when the slots are full.
async function reserveSendSlot({ adapter, identifier, max, now, windowSeconds }) {
  await adapter.deleteMany({
    model: 'verification',
    where: [
      { field: 'identifier', value: identifier },
      { field: 'expiresAt', operator: 'lt', value: now },
    ],
  });
  const record = await adapter.create({
    model: 'verification',
    data: {
      identifier,
      value: 'sent',
      expiresAt: new Date(now.getTime() + windowSeconds * 1000),
      createdAt: now,
      updatedAt: now,
    },
  });
  const taken = await adapter.count({
    model: 'verification',
    where: [{ field: 'identifier', value: identifier }],
  });
  if (taken <= max) {
    return record;
  }
  await adapter.delete({ model: 'verification', where: [{ field: 'id', value: record.id }] });
  return null;
}

export default reserveSendSlot;
