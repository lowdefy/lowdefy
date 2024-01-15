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

import { v1, v3, v4, v5 } from 'uuid';
import { type } from '@lowdefy/helpers';

import { runClass } from '@lowdefy/operators';

const meta = {
  v1: { noArgs: true },
  v3: { namedArgs: ['name', 'namespace'], validTypes: ['array', 'object'] },
  v4: { noArgs: true },
  v5: { namedArgs: ['name', 'namespace'], validTypes: ['array', 'object'] },
};

const functions = { v1, v3, v4, v5 };

function _uuid({ params, location, methodName }) {
  if (type.isNone(methodName) && (type.isNone(params) || params === true)) {
    return v4();
  }
  return runClass({
    functions,
    location,
    meta,
    methodName,
    operator: '_uuid',
    params,
  });
}

export default _uuid;
