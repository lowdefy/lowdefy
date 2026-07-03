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

import getCollection from '../getCollection.js';

async function updateNotificationSendResult({
  connection,
  id,
  sent,
  email_result,
  increment_send_attempts,
  last_attempt,
}) {
  const set = {};
  if (!type.isUndefined(sent)) {
    set.sent = sent;
  }
  if (!type.isUndefined(email_result)) {
    set.email_result = email_result;
  }
  if (!type.isUndefined(last_attempt)) {
    set.last_attempt = last_attempt;
  }
  const update = {};
  if (Object.keys(set).length > 0) {
    update.$set = set;
  }
  if (increment_send_attempts === true) {
    update.$inc = { send_attempts: 1 };
  }
  const { collection, client } = await getCollection({ connection });
  try {
    await collection.updateOne({ _id: id }, update);
  } finally {
    await client.close();
  }
}

export default updateNotificationSendResult;
