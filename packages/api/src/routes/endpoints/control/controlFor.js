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
import runRoutine from '../runRoutine.js';

async function controlFor(context, routineContext, { control }) {
  const { endpointId, logger, evaluateOperators } = context;
  const { items } = routineContext;

  const itemName = control[':for'];
  if (!itemName) {
    throw new Error(`Invalid :for in endpoint "${endpointId}" - missing variable name in :for.`);
  }

  const array = evaluateOperators({
    input: control[':in'],
    items,
    location: control['~k'] ?? ':for',
  });

  logger.debug({
    event: 'debug_control_for',
    array,
    itemName,
  });

  if (!Array.isArray(array)) {
    throw new ConfigError({
      message: `Invalid :for in endpoint "${endpointId}" - :in must evaluate to an array.`,
      received: array,
      configKey: control['~k'],
    });
  }

  if (!control[':do']) {
    throw new Error(`Invalid :for in endpoint "${endpointId}" - missing :do.`);
  }

  for (const [index, item] of array.entries()) {
    const updatedItems = { ...items, [itemName]: item };

    logger.debug({
      event: 'debug_control_for_iteration',
      itemName: itemName,
      value: item,
      items: updatedItems,
    });

    const res = await runRoutine(
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

    if (res?.status != 'continue') {
      return res;
    }
  }

  return { status: 'continue' };
}

export default controlFor;
