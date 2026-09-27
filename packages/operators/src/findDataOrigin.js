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

import { serializer, type } from '@lowdefy/helpers';

import getDataIndexKeys from './getDataIndexKeys.js';

// The operator whose result an object is, or a copy of, or null when the object
// is config. Only objects that could become a block, an action or an operator
// are tracked (getDataIndexKeys).
function findDataOrigin({ literalData, value }) {
  if (!type.isObject(value)) {
    return null;
  }
  const byIdentity = literalData.dataObjects.get(value);
  if (!type.isUndefined(byIdentity)) {
    return byIdentity;
  }
  const indexKeys = getDataIndexKeys({ value, operators: literalData.clientOperators }).filter(
    (indexKey) => literalData.dataShapes.has(indexKey)
  );
  if (indexKeys.length === 0) {
    return null;
  }
  const shape = serializer.serializeToString(value, { skipMarkers: true });
  for (const indexKey of indexKeys) {
    const operator = literalData.dataShapes.get(indexKey).get(shape);
    if (!type.isUndefined(operator)) {
      return operator;
    }
  }
  return null;
}

export default findDataOrigin;
