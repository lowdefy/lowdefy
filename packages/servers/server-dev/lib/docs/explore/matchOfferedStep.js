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

import { omit } from '@lowdefy/helpers';

function targetKey(target) {
  return JSON.stringify(
    Object.keys(target)
      .sort()
      .map((key) => [key, target[key]])
  );
}

// The candidate in the walk's latest observation that a step acts on, matched
// by kind and target (a fill or select value is the policy's choice, not part
// of the match), or null. A step that matches no offered candidate is refused,
// so the exclusions hold for any caller, not only the explorer.
function matchOfferedStep({ step, observation }) {
  const [kind] = Object.keys(step);
  const target = kind === 'click' ? step.click : omit({ ...step[kind] }, ['value']);
  const key = targetKey(target);
  return (
    (observation?.candidates ?? []).find(
      (candidate) => candidate.kind === kind && targetKey(candidate.target) === key
    ) ?? null
  );
}

export default matchOfferedStep;
