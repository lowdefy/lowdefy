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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import getConnection from '../connections/getConnection.js';
import getConnectionConfig from '../connections/getConnectionConfig.js';

async function getMailSend(context, { connectionId, configKey }) {
  const connectionConfig = await getConnectionConfig(context, { connectionId, configKey });
  const connection = getConnection(context, { connectionConfig });

  if (!type.isFunction(connection.email?.send)) {
    throw new ConfigError(
      `Connection "${connectionId}" of type "${connectionConfig.type}" does not support sending email (no email.send capability).`,
      { configKey }
    );
  }

  // Secrets and other operators in connection properties resolve here.
  const connectionProperties = context.evaluateOperators({
    input: connectionConfig.properties ?? {},
    location: connectionConfig.connectionId,
    payload: {},
    state: {},
    steps: {},
  });

  return { send: connection.email.send, connectionProperties };
}

export default getMailSend;
