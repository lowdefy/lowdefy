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

// A fail gate (addFailGate) in words, by its request and what narrows it: 'request "x"' or
// 'request "x" on endpoint "y" and page "z"', for a report of a gate that never fired.
function describeFailGate(gate) {
  const narrowing = [];
  if (!type.isNone(gate.endpoint)) {
    narrowing.push(`endpoint "${gate.endpoint}"`);
  }
  if (!type.isNone(gate.pageId)) {
    narrowing.push(`page "${gate.pageId}"`);
  }
  return narrowing.length === 0
    ? `request "${gate.requestId}"`
    : `request "${gate.requestId}" on ${narrowing.join(' and ')}`;
}

export default describeFailGate;
