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

import journeyTargetSelectors from './journeyTargetSelectors.js';

// Whether an element is an interactive control in the journey runner's sense: it matches
// journeyTargetSelectors.interactiveControl. Reads the rules one by one, so it also works in DOMs
// that cannot parse the combined selector (jsdom).
function isInteractiveControl(element) {
  return journeyTargetSelectors.interactiveControlRules.some(
    ({ selector, has, not = [] }) =>
      element.matches(selector) &&
      (!has || element.querySelector(has) !== null) &&
      !not.some((excluded) => element.matches(excluded))
  );
}

export default isInteractiveControl;
