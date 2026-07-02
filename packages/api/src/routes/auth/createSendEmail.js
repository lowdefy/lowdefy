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

import nodemailer from 'nodemailer';
import { ServiceError } from '@lowdefy/errors';

// auth.email configures one SMTP transport that every auth email
// (verification, password reset, magic link) sends through. Transport
// correctness cannot be validated at build - host and credentials are
// secrets - so failures surface here at send time.
function createSendEmail({ emailConfig }) {
  const { host, port, secure, auth } = emailConfig.provider.properties ?? {};
  const transport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth,
  });

  return async function sendEmail({ to, subject, text, html }) {
    try {
      await transport.sendMail({
        from: emailConfig.from,
        to,
        subject,
        text,
        html,
      });
    } catch (error) {
      throw new ServiceError(undefined, {
        cause: error,
        service: 'SMTP',
      });
    }
  };
}

export default createSendEmail;
