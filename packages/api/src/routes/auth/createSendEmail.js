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

import send from '@lowdefy/connection-smtp/send';
import { ServiceError } from '@lowdefy/errors';

import getConnectionConfig from '../connections/getConnectionConfig.js';

// auth.email sends every auth email (verification, password reset, magic link)
// through an SMTP connection. Resolving the connection per fire lets operators
// and the connection's delivery filter apply, so failures - and filtering -
// surface here at send time rather than at construction.
function createSendEmail({ connectionId }) {
  return async function sendEmail({ to, subject, html, text, context }) {
    const connectionConfig = await getConnectionConfig(context, { connectionId });
    const connection = context.evaluateOperators({
      input: connectionConfig.properties ?? {},
      location: connectionId,
    });
    try {
      return await send({ connection, mail: { to, subject, html, text } });
    } catch (error) {
      throw new ServiceError(undefined, {
        cause: error,
        service: 'SMTP',
      });
    }
  };
}

export default createSendEmail;
