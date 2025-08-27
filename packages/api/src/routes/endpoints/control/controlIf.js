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

import runRoutine from '../runRoutine.js';

async function controlIf(context, routineContext, { control }) {
  const { logger, evaluateOperators } = context;
  const { items } = routineContext;

  const evaluatedIf = evaluateOperators({ input: control[':if'], items, location: 'TODO:' });

  logger.debug({
    event: 'debug_control_if',
    condition: {
      input: control[':if'],
      evaluated: evaluatedIf,
    },
  });
  if (evaluatedIf) {
    logger.debug({
      event: 'debug_control_if_run_then',
    });
    if (!control[':then']) {
      throw new Error('Invalid :if - missing :then.');
    }
    return runRoutine(context, routineContext, { routine: control[':then'] });
  } else if (control[':else']) {
    logger.debug({
      event: 'debug_control_if_run_else',
    });
    return runRoutine(context, routineContext, { routine: control[':else'] });
  }
  return { status: 'continue' };
}

export default controlIf;
