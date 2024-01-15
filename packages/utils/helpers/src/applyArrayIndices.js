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

import type from './type.js';

const applyArrayIndices = (arrayIndices, name) => {
  if (!type.isArray(arrayIndices)) return name;
  if (arrayIndices.length === 0) return name;
  if (type.isNumber(name)) return name;
  const copy = JSON.parse(JSON.stringify(arrayIndices));
  const index = copy.shift();
  let newName;
  if (name.includes('$')) {
    newName = name.replace('$', index.toString()); // lgtm [js/incomplete-sanitization]
  } else {
    newName = name;
  }
  return applyArrayIndices(copy, newName);
};

export default applyArrayIndices;
