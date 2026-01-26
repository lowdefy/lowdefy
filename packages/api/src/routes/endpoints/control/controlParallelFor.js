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

async function controlParallelFor(context, routineContext, { control }) {
  const { endpointId, logger, evaluateOperators } = context;
  const { items } = routineContext;

  const itemName = control[':parallel_for'];
  if (!itemName) {
    throw new Error(
      `Invalid :parallel_for in endpoint "${endpointId}" - missing variable name in :parallel_for.`
    );
  }

  const array = evaluateOperators({
    input: control[':in'],
    items,
    location: control['~k'] ?? ':parallel_for',
  });

  logger.debug({
    event: 'debug_control_parallel',
    array,
    itemName,
  });

  if (!Array.isArray(array)) {
    throw new Error(
      `Invalid :parallel_for in endpoint "${endpointId}" - :in must evaluate to an array. Received ${JSON.stringify(
        array
      )}.`
    );
  }

  if (!control[':do']) {
    throw new Error(`Invalid :parallel_for in endpoint "${endpointId}" - missing :do.`);
  }

  const promises = array.map((item, index) => {
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
  });

  const results = await Promise.all(promises);

  const resultsMap = { error: [], reject: [], return: [], continue: [] };
  results.forEach((res) => (resultsMap[res.status] = [...resultsMap[res.status], res]));

  return (
    resultsMap.error?.[0] ??
    resultsMap.reject?.[0] ??
    resultsMap.return?.[0] ?? { status: 'continue' }
  );
}

export default controlParallelFor;
