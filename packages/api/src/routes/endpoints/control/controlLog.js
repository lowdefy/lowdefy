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
  const { logger, evaluateOperators } = context;
  const { items } = routineContext;

  logger.debug({ event: 'debug_control_log' });
  const log = evaluateOperators({ input: control[':log'], items, location: 'TODO:' });
  const logLevel =
    evaluateOperators({ input: control[':level'], items, location: 'TODO:' }) ?? 'info';

  if (!type.isObject(log) && !type.isString(log)) {
    throw new Error(`Unrecognised type for :log. Received ${log}.`);
  }
  if (!type.isString(logLevel)) {
    throw new Error(`Unrecognised type for :level. Received ${logLevel}.`);
  }
  if (!logger[logLevel]) {
    throw new Error(`Invalid log level for :log. Received ${logLevel}.`);
  }

  logger[logLevel](log);

  return { status: 'continue' };
}

export default controlLog;
