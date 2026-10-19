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

// The newest month any of the journeys' live production evidence holds, as
// `YYYY-MM`: the anchor that puts every journey of one selection on the same
// calendar. Undefined when none has monthly evidence.
function newestMonth({ journeys }) {
  let newest;
  journeys.forEach((journey) => {
    const months = journey.evidence?.production?.months;
    if (!type.isArray(months)) return;
    months.forEach(({ month }) => {
      if (type.isUndefined(newest) || month > newest) newest = month;
    });
  });
  return newest;
}

export default newestMonth;
