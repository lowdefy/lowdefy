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

import sendgrid from '@sendgrid/mail';

import applyMailFilter from './applyMailFilter.js';

// https://sendgrid.api-docs.io/v3.0/how-to-use-the-sendgrid-v3-api/api-authentication
// https://github.com/sendgrid/sendgrid-nodejs/blob/master/docs/use-cases/README.md#email-use-cases

async function send({ connection, mail }) {
  const { apiKey, from, replyTo, templateId, mailSettings, filter } = connection;
  sendgrid.setApiKey(apiKey);
  const filtered = applyMailFilter({ filter, mail });
  if (filtered === null) {
    return { messageId: null, to: null, filtered: true };
  }
  const message = {
    ...filtered,
    from,
    replyTo: filtered.replyTo ?? replyTo,
    // Fall back to the mail templateId so an undefined connection templateId
    // does not clobber a template set on the mail itself.
    templateId: templateId ?? filtered.templateId,
    mailSettings,
  };
  try {
    const [response] = await sendgrid.send(message);
    // Return the post-filter to so callers can record where mail actually went
    // when a connection filter (replaceAddress/allowlist/regex) rewrites it.
    return { messageId: response?.headers?.['x-message-id'] ?? null, to: filtered.to };
  } catch (error) {
    if (error.response) {
      throw new Error('SendGrid request failed.', { cause: error });
    }
    throw error;
  }
}

export default send;
