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

// A copy of a journey's result with every string scrubbed of the credentials its calls marked, as
// the server's logger scrubs a line: the result (its failure messages, the faults it names, the
// calls it recorded) is printed after each call's scope has ended. An Error keeps its name.
function scrubMarkedValues({ scrubs, value }) {
  if (scrubs.length === 0) {
    return value;
  }
  if (type.isString(value)) {
    return scrubs.reduce((text, scrub) => scrub(text), value);
  }
  if (type.isArray(value)) {
    return value.map((item) => scrubMarkedValues({ scrubs, value: item }));
  }
  if (type.isError(value)) {
    const error = new Error(scrubMarkedValues({ scrubs, value: value.message }));
    error.name = value.name;
    return error;
  }
  if (type.isObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, scrubMarkedValues({ scrubs, value: item })])
    );
  }
  return value;
}

export default scrubMarkedValues;
