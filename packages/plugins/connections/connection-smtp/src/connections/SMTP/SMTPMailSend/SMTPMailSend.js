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

import resolveMailFilter from '../resolveMailFilter.js';
import send from '../send.js';
import schema from './schema.js';

async function SMTPMailSend({ request, connection, environment }) {
  const messages = type.isArray(request) ? request : [request];
  // The current environment can switch email off (config.environments.<env>.email.enabled: false):
  // nothing is sent, and each message reports it was not.
  if (environment?.email?.enabled === false) {
    return {
      response: 'Mail is disabled in this environment.',
      results: messages.map(() => ({ messageId: null, to: null, disabled: true })),
    };
  }
  const filter = resolveMailFilter({ connection, environment });
  const results = [];
  // Send sequentially so a single SMTP connection or pool is not overwhelmed.
  for (const mail of messages) {
    results.push(await send({ connection: { ...connection, filter }, mail }));
  }
  return { response: 'Mail sent successfully', results };
}

SMTPMailSend.schema = schema;
SMTPMailSend.meta = {
  checkRead: false,
  checkWrite: false,
};

export default SMTPMailSend;
