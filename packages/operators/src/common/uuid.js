/*
  Copyright 2020-2021 Lowdefy, Inc

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

import { v1, v2, v3, v4, v5 } from 'uuid';
import { type } from '@lowdefy/helpers';

function _uuid({ params, location }) {
  if (type.isNone(params) || params === true) {
    return v4();
  }
  if (params === 'v1') {
    return v1();
  }
  if (params === 'v2') {
    return v2();
  }
  if (params === 'v3') {
    return v3();
  }
  if (params === 'v4') {
    return v4();
  }
  if (params === 'v5') {
    return v5();
  }
  throw new Error(
    `Operator Error: _uuid must be a one of v1, v2, v3, v4 or true. Received: ${JSON.stringify(
      params
    )} at ${location}.`
  );
}

export default _uuid;
