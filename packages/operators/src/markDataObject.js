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

import { serializer } from '@lowdefy/helpers';

import getDataIndexKeys from './getDataIndexKeys.js';

// Remembers one object as data returned by `operator`: by identity, so a later
// merge into it still counts, and by its serialized form, so a copy (_get,
// _args, a _function body) is still recognised.
function markDataObject({ literalData, value, operator }) {
  const indexKeys = getDataIndexKeys({ value, operators: literalData.clientOperators });
  if (indexKeys.length === 0) {
    return;
  }
  literalData.dataObjects.set(value, operator);
  const shape = serializer.serializeToString(value, { skipMarkers: true });
  indexKeys.forEach((indexKey) => {
    if (!literalData.dataShapes.has(indexKey)) {
      literalData.dataShapes.set(indexKey, new Map());
    }
    literalData.dataShapes.get(indexKey).set(shape, operator);
  });
}

export default markDataObject;
