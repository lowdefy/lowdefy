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
import { getStepKey } from '@lowdefy/node-utils';

// A journey that reads the dev mail sink takes the newest email to an address
// since it started, so it must run with no other journey in flight.
function readsMail(journey) {
  return journey.steps.some((step) => {
    const key = getStepKey(step);
    return key === 'email' || (key === 'fill' && !type.isUndefined(step.fill.fromEmail));
  });
}

export default readsMail;
