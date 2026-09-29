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

function collectPaths({ value, prefix, paths }) {
  if (!type.isObject(value) || Object.keys(value).length === 0) {
    paths.push(prefix);
    return;
  }
  Object.entries(value).forEach(([key, item]) => {
    collectPaths({ value: item, prefix: `${prefix}.${key}`, paths });
  });
}

// The leaf paths insertDefaults set, so a default { address: { country } } leaves the field
// "address.city" writable while { owner: { id } } keeps "owner.id" out of reach.
function getInsertDefaultPaths({ insertDefaults }) {
  const paths = [];
  Object.entries(insertDefaults).forEach(([key, value]) => {
    collectPaths({ value, prefix: key, paths });
  });
  return paths;
}

export default getInsertDefaultPaths;
