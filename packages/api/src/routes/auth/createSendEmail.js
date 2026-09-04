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
import logEvent from '../../log/logEvent.js';

// auth.email sends every auth email (verification, password reset, magic link)
// through an SMTP connection. Resolving the connection per fire lets operators
// and the connection's delivery filter apply, so failures - and filtering -
// surface here at send time rather than at construction.
//
// This is the one place the framework itself delivers a notification: the send
// does not go through the request resolver, so it writes no request_completed
// line and nothing else would record it. It emits its own wide event instead -
// `notification_delivered` / `notification_failed` - which is what
// build/monitors.json watches for the auth email flows. The line carries the
// notification, the channel, the connection and the outcome; never the
// recipient address, the subject or the body, which are the person's, not the
// deployment's.
function createSendEmail({ connectionId }) {
  return async function sendEmail({ to, subject, html, text, context, notificationId = null }) {
    const connectionConfig = await getConnectionConfig(context, { connectionId });
    const connection = context.evaluateOperators({
      input: connectionConfig.properties ?? {},
      location: connectionId,
    });
    const fields = {
      notification_id: notificationId,
      channel: 'email',
      connection_id: connectionId,
    };
    const startTime = performance.now();
    try {
      const result = await send({ connection, mail: { to, subject, html, text } });
      logEvent({
        context,
        event: 'notification_delivered',
        fields: {
          ...fields,
          duration_ms: Math.round(performance.now() - startTime),
          success: true,
          // The connection's delivery filter dropping a recipient is a
          // successful send of nothing - counting it as delivered would read as
          // healthy mail on a deployment that sends none.
          filtered: result?.filtered === true,
        },
      });
      return result;
    } catch (error) {
      // Only an unreachable or faulty SMTP host is a service outage - a rejected
      // login or a refused recipient is the deployment's own configuration.
      const thrown = ServiceError.isServiceError(error)
        ? new ServiceError(undefined, { cause: error, service: 'SMTP' })
        : error;
      logEvent({
        context,
        event: 'notification_failed',
        fields: {
          ...fields,
          duration_ms: Math.round(performance.now() - startTime),
          success: false,
          error: thrown,
        },
      });
      throw thrown;
    }
  };
}

export default createSendEmail;
