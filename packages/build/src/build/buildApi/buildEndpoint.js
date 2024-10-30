/* eslint-disable no-param-reassign */

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
import createCounter from '../../utils/createCounter.js';
import buildGraph from './buildGraph/buildGraph.js';
import createCheckDuplicateId from '../../utils/createCheckDuplicateId.js';

function buildEndpoint({ api, index, context, checkDuplicateApiId }) {
  // API Stuff
  if (type.isUndefined(api.id)) {
    throw new Error(`Api id missing at api ${index}.`);
  }
  if (!type.isString(api.id)) {
    throw new Error(`Api id is not a string at api ${index}. Received ${JSON.stringify(api.id)}.`);
  }
  checkDuplicateApiId({ id: api.id });
  api.apiId = api.id;

  buildGraph(api.stages, {
    stageIdCounter: createCounter(),
    checkDuplicateStageId: createCheckDuplicateId({
      message: 'Duplicate stageId "{{ id }}" on api "{{ apiId }}"',
    }),
    apiId: api.apiId,
    typeCounters: context.typeCounters,
  });

  api.id = `api:${api.apiId}`;
}

export default buildEndpoint;
