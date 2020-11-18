/*
  Copyright 2020 Lowdefy, Inc

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
import schema from './SendGridMailSendSchema.json';

// https://sendgrid.api-docs.io/v3.0/how-to-use-the-sendgrid-v3-api/api-authentication
// https://github.com/sendgrid/sendgrid-nodejs/blob/master/docs/use-cases/README.md#email-use-cases

async function sendGridMailSend({ request, connection }) {
  const { apiKey, from, templateId, mailSettings } = connection;
  const {
    to,
    cc,
    bcc,
    replyTo,
    subject,
    text,
    html,
    dynamicTemplateData,
    attachments,
    categories,
    sendAt,
    batchId,
  } = request;

  sendgrid.setApiKey(apiKey);
  const msg = {
    to,
    cc,
    bcc,
    from,
    replyTo,
    subject,
    text,
    html,
    templateId,
    dynamicTemplateData,
    attachments,
    categories,
    sendAt,
    batchId,
    mailSettings,
  };
  try {
    await sendgrid.send(msg);
  } catch (error) {
    if (error.response) {
      throw new Error(JSON.stringify(error.response.body));
    }
    throw error;
  }
  return { response: 'Mail sent successfully' };
}

export default { resolver: sendGridMailSend, schema, checkRead: false, checkWrite: false };
