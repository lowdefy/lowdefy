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

import checkAborted from '../checkAborted.js';
import runRoutine from '../runRoutine.js';

async function controlWhile(context, routineContext, { control }) {
  const { endpointId, logger, evaluateOperators } = context;
  const { items } = routineContext;

  if (!control[':do']) {
    throw new Error(`Invalid :while in endpoint "${endpointId}" - missing :do.`);
  }

  // No array index is pushed onto routineContext.arrayIndices. A :while has no item to
  // index, so each iteration overwrites the previous iteration's step results, and
  // `_step: my_step` reads the latest iteration's value. There is no iteration cap:
  // the request's abort signal is what stops a runaway loop (checkAborted).
  let iteration = 0;
  while (true) {
    checkAborted(context, { location: 'the next :while iteration' });

    // The condition is evaluated fresh every iteration, so it sees the state and step
    // results the body wrote. Hoisting it out of the loop makes the loop infinite.
    const evaluated = evaluateOperators({
      input: control[':while'],
      items,
      location: control['~k'] ?? ':while',
      payload: routineContext.payload,
      state: routineContext.state,
      steps: routineContext.steps,
    });

    if (!evaluated) {
      return { status: 'continue' };
    }

    // Logged after the break test: a runaway loop already holds a worker, and
    // logging its condition per iteration would flood the log transport at the
    // loop's spin rate as well.
    logger.debug({
      event: 'debug_control_while',
      condition: {
        input: control[':while'],
        evaluated,
      },
      iteration,
    });

    const res = await runRoutine(context, routineContext, { routine: control[':do'] });

    if (res?.status != 'continue') {
      return res;
    }

    iteration += 1;
  }
}

export default controlWhile;
