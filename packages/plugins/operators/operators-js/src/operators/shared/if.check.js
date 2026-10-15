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

import { getOperatorType, type } from '@lowdefy/helpers';

// _if is not dynamic, so params that are one operator ({ _state: ifParams })
// are evaluated first and may give a valid object. Array and primitive params
// are left to the runtime error.
const ifTest = {
  id: 'if-test',
  level: 'error',
  description: '_if needs its condition under test.',
  check: ({ params }) =>
    type.isObject(params) && !('test' in params) && getOperatorType(params) === null
      ? '_if has no test key. Put the condition under test:.'
      : null,
};

export default ifTest;
