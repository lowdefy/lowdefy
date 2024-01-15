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
import makeRefDefinition from './makeRefDefinition.js';

function getRefsFromFile(fileContent, parentRefDefId, refMap) {
  const foundRefs = [];
  const reviver = (key, value) => {
    if (type.isObject(value)) {
      if (!type.isUndefined(value._ref)) {
        const def = makeRefDefinition(value._ref, parentRefDefId, refMap);
        foundRefs.push(def);
        return {
          _ref: def,
        };
      }
    }
    return value;
  };
  const fileContentBuiltRefs = JSON.parse(JSON.stringify(fileContent), reviver);
  return { foundRefs, fileContentBuiltRefs };
}

export default getRefsFromFile;
