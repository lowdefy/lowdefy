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

import send from '../send.js';
import schema from './schema.js';

async function SendGridMailSend({ request, connection }) {
  const messages = type.isArray(request) ? request : [request];
  // Send per message so the connection mail filter is enforced in one place.
  for (const mail of messages) {
    await send({ connection, mail });
  }
  return { response: 'Mail sent successfully' };
}

SendGridMailSend.schema = schema;
SendGridMailSend.meta = {
  checkRead: false,
  checkWrite: false,
};

export default SendGridMailSend;
