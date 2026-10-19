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

import microUsd from './microUsd.js';

// X-Treg-Cost-Micro is the settled charge in integer micro-USD. It is absent on a call
// that ran on the team's own key, which treg does not bill, so that call cost nothing.
function parseCost(header) {
  if (!type.isString(header) || !/^[0-9]+$/.test(header.trim())) {
    return microUsd(0);
  }
  return microUsd(Number.parseInt(header.trim(), 10));
}

export default parseCost;
