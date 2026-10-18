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

import { journeyTargetSelectors } from '@lowdefy/helpers';

const { blockWrapperPrefix } = journeyTargetSelectors;

function isPasswordInput(element) {
  return (
    typeof element?.tagName === 'string' &&
    element.tagName.toLowerCase() === 'input' &&
    element.type === 'password'
  );
}

// Whether an interaction's element belongs to a password block: the element,
// or its block's `<blockId>_input` element, is an `<input type="password">`.
// The visibility toggle turns the input into `type="text"`, so the block's own
// input is checked too, which a click on the toggle reaches.
function isPasswordElement(element) {
  if (isPasswordInput(element)) return true;
  const wrapper = element?.closest?.(`[id^="${blockWrapperPrefix}"]`);
  if (!wrapper) return false;
  const blockId = wrapper.id.slice(blockWrapperPrefix.length);
  return isPasswordInput(element.ownerDocument?.getElementById(`${blockId}_input`));
}

export default isPasswordElement;
