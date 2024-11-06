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

function pushVariables(context, { newItems }) {
  // if (!context.itemStack) {
  //   context.itemStack = [];
  // }
  if (!context.items) {
    context.items = {};
  }
  context.items = { ...context.items, ...newItems };
  // context.itemStack.push(context.items);
}

// function popVariables(context) {
//   context.items = context.itemStack.pop();
// }

async function controlFor(context, { control, items }) {
  const { logger, evaluateOperators } = context;

  const variableName = control[':for'];
  if (!variableName) {
    throw new Error('Invalid :for - missing variable name in :for.');
  }

  const array = evaluateOperators({ input: control[':in'], location: 'TODO: ', items });

  logger.debug({
    event: 'debug_control_for',
    array,
  });

  if (!Array.isArray(array)) {
    throw new Error('Invalid :for - evaluated :in to non-array.');
  }

  if (!control[':do']) {
    throw new Error('Invalid :for - missing :do.');
  }

  for (const item of array) {
    pushVariables(context, { newItems: { [variableName]: item } });

    logger.debug({
      event: 'debug_control_for_iteration',
      variable: variableName,
      value: item,
      items: context.items,
    });

    const res = await runRoutine(context, {
      routine: control[':do'],
      items: { ...items, [variableName]: item },
    });

    if (res.status != 'continue') {
      return res;
    }

    // popVariables(context);
  }

  return { status: 'continue' };
}

export default controlFor;
