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

import { type } from '@lowdefy/helpers';

async function controlLog(context, routineContext, { control }) {
  const { endpointId, logger, evaluateOperators } = context;
  const { items } = routineContext;
  const location = control['~k'] ?? ':log';

  logger.debug({ event: 'debug_control_log' });
  const log = evaluateOperators({ input: control[':log'], items, location });
  const logLevel = evaluateOperators({ input: control[':level'], items, location }) ?? 'info';

  if (!type.isString(logLevel)) {
    throw new Error(
      `Invalid :log in endpoint "${endpointId}" - :level must be a string. Received ${JSON.stringify(logLevel)}.`
    );
  }
  if (!logger[logLevel]) {
    throw new Error(
      `Invalid :log in endpoint "${endpointId}" - unrecognised log level. Received "${logLevel}".`
    );
  }

  logger[logLevel](log);

  return { status: 'continue' };
}

export default controlLog;
