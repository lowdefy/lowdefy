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

async function controlSwitch(context, routineContext, { control }) {
  const { endpointId, logger, evaluateOperators } = context;
  const { items } = routineContext;
  const cases = control[':switch'];
  logger.debug({
    event: 'debug_control_switch',
  });
  for (const caseObj of cases) {
    const evaluatedCase = evaluateOperators({
      input: caseObj[':case'],
      items,
      location: caseObj['~k'] ?? control['~k'] ?? ':switch',
    });
    logger.debug({
      event: 'debug_control_switch_case',
      case: {
        input: caseObj[':case'],
        evaluated: evaluatedCase,
      },
    });
    if (evaluatedCase) {
      logger.debug({
        event: 'debug_control_switch_run_then',
      });
      if (!caseObj[':then']) {
        throw new Error(`Invalid :switch :case in endpoint "${endpointId}" - missing :then.`);
      }
      return runRoutine(context, routineContext, { routine: caseObj[':then'] });
    }
  }
  if (control[':default']) {
    logger.debug({ event: 'debug_control_switch_run_default' });
    return runRoutine(context, routineContext, { routine: control[':default'] });
  }
  return { status: 'continue' };
}
export default controlSwitch;
