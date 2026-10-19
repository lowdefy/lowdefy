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

// --repeat runs each selected journey n times in a row, 1 to 10, default 1.
function parseRepeat(value) {
  if (type.isNone(value)) {
    return { repeat: 1 };
  }
  const repeat = Number(value);
  if (!Number.isInteger(repeat) || repeat < 1 || repeat > 10) {
    return {
      error: `--repeat must be an integer from 1 to 10. Received ${JSON.stringify(value)}.`,
    };
  }
  return { repeat };
}

export default parseRepeat;
