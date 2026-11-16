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

// The name a _secret operator reads: `_secret: NAME`, or `_secret: { key: NAME, default }`. A
// name computed by another operator is not known before the request runs, so it gets no
// stand-in.
function readSecretName(params) {
  if (type.isString(params)) return params;
  if (type.isObject(params) && type.isString(params.key)) return params.key;
  return null;
}

// Every secret name the _secret operators in one parsed build artifact read, added to `names`.
function collectSecretNames({ names, value }) {
  if (type.isArray(value)) {
    value.forEach((item) => collectSecretNames({ names, value: item }));
    return;
  }
  if (!type.isObject(value)) return;
  Object.entries(value).forEach(([key, item]) => {
    if (key === '_secret') {
      const name = readSecretName(item);
      if (!type.isNone(name)) names.add(name);
    }
    collectSecretNames({ names, value: item });
  });
}

export default collectSecretNames;
