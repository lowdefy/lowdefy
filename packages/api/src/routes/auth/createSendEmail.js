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
import { ConfigError, ServiceError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import getConnectionConfig from '../connections/getConnectionConfig.js';

// auth.email sends every auth email (verification, password reset, magic link)
// through an SMTP connection. Resolving the connection per fire lets operators
// and the connection's delivery filter apply, so failures - and filtering -
// surface here at send time rather than at construction. A failure names the
// connection and points at auth.email, never the recipient: the server's reply
// quotes the address it refused.
function createSendEmail({ authEmailConfig }) {
  const { connectionId } = authEmailConfig;
  const configKey = authEmailConfig['~k'];
  return async function sendEmail({ to, subject, html, text, context }) {
    const connectionConfig = await getConnectionConfig(context, { connectionId });
    const connection = context.evaluateOperators({
      input: connectionConfig.properties ?? {},
      location: connectionId,
    });
    try {
      return await send({ connection, mail: { to, subject, html, text } });
    } catch (error) {
      // Only an unreachable or faulty SMTP host is a service outage - a rejected
      // login or a refused recipient is the deployment's own configuration.
      if (ServiceError.isServiceError(error)) {
        throw new ServiceError(undefined, {
          cause: error,
          service: 'SMTP',
          configKey,
        });
      }
      const code = type.isNone(error?.code) ? '' : ` (${error.code})`;
      throw new ConfigError(
        `Auth email could not be sent through connection "${connectionId}"${code}. Check the SMTP connection auth.email.connectionId names.`,
        { cause: error, configKey }
      );
    }
  };
}

export default createSendEmail;
