/*
  Copyright 2020-2024 Lowdefy, Inc

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
import { type } from '@lowdefy/helpers';
import schema from './schema.js';

// https://sendgrid.api-docs.io/v3.0/how-to-use-the-sendgrid-v3-api/api-authentication
// https://github.com/sendgrid/sendgrid-nodejs/blob/master/docs/use-cases/README.md#email-use-cases

async function SendGridMailSend({ request, connection }) {
  const { apiKey, from, templateId, mailSettings } = connection;
  sendgrid.setApiKey(apiKey);
  const messages = (type.isArray(request) ? request : [request]).map((msg) => ({
    ...msg,
    from,
    templateId,
    mailSettings,
  }));
  try {
    await sendgrid.send(messages);
  } catch (error) {
    if (error.response) {
      throw new Error(JSON.stringify(error.response.body));
    }
    throw error;
  }
  return { response: 'Mail sent successfully' };
}

SendGridMailSend.schema = schema;
SendGridMailSend.meta = {
  checkRead: false,
  checkWrite: false,
};

export default SendGridMailSend;
