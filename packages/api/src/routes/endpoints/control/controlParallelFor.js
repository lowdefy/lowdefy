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

import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';
import runRoutine from '../runRoutine.js';
import evaluateRoutineOperators from '../evaluateRoutineOperators.js';

// Runs `run(index)` for every index, at most `limit` at a time (every index at once without a
// limit), and resolves with the results in index order.
async function runLimited({ count, limit, run }) {
  if (type.isUndefined(limit) || limit >= count) {
    return Promise.all(Array.from({ length: count }, (_, index) => run(index)));
  }
  const results = new Array(count);
  let next = 0;
  async function lane() {
    while (next < count) {
      const index = next;
      next += 1;
      results[index] = await run(index);
    }
  }
  await Promise.all(Array.from({ length: limit }, () => lane()));
  return results;
}

async function controlParallelFor(context, routineContext, { control }) {
  const { endpointId, logger } = context;
  const { items } = routineContext;

  const itemName = control[':parallel_for'];
  if (!itemName) {
    throw new Error(
      `Invalid :parallel_for in endpoint "${endpointId}" - missing variable name in :parallel_for.`
    );
  }

  const array = evaluateRoutineOperators(context, routineContext, {
    input: control[':in'],
    location: control['~k'] ?? ':parallel_for',
  });

  logger.debug({
    event: 'debug_control_parallel',
    array,
    itemName,
  });

  if (!Array.isArray(array)) {
    throw new ConfigError(
      `Invalid :parallel_for in endpoint "${endpointId}" - :in must evaluate to an array.`,
      { received: array, configKey: control['~k'] }
    );
  }

  if (!control[':do']) {
    throw new Error(`Invalid :parallel_for in endpoint "${endpointId}" - missing :do.`);
  }

  const concurrency = evaluateRoutineOperators(context, routineContext, {
    input: control[':concurrency'],
    location: control['~k'] ?? ':parallel_for',
  });
  if (!type.isUndefined(concurrency) && (!type.isInt(concurrency) || concurrency < 1)) {
    throw new ConfigError(
      `Invalid :parallel_for in endpoint "${endpointId}" - :concurrency must be a positive integer.`,
      { received: concurrency, configKey: control['~k'] }
    );
  }

  // Every item runs, whatever an earlier one returned: :concurrency only limits how many run at
  // once, so the result is the same with or without it.
  const results = await runLimited({
    count: array.length,
    limit: concurrency,
    run: (index) => {
      const item = array[index];
      const updatedItems = { ...items, [itemName]: item };

      logger.debug({
        event: 'debug_control_parallel_iteration',
        itemName: itemName,
        value: item,
        items: updatedItems,
      });

      return runRoutine(
        context,
        {
          ...routineContext,
          arrayIndices: [...routineContext.arrayIndices, index],
          items: updatedItems,
        },
        {
          routine: control[':do'],
        }
      );
    },
  });

  const resultsMap = { error: [], reject: [], return: [], continue: [] };
  results.forEach((res) => (resultsMap[res.status] = [...resultsMap[res.status], res]));

  return (
    resultsMap.error?.[0] ??
    resultsMap.reject?.[0] ??
    resultsMap.return?.[0] ?? { status: 'continue' }
  );
}

export default controlParallelFor;
