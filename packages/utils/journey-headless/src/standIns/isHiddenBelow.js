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

// Whether the html hides the element between it and `stop` (exclusive): the hidden attribute, an
// inline display: none or visibility: hidden, or a closed <details> around it (all but its
// summary), as a reader without layout tells it (e2e-utils' resolveTargetInDocument reads the
// first three).
function isHiddenBelow({ element, stop }) {
  for (
    let current = element;
    current !== null && current !== stop;
    current = current.parentElement
  ) {
    if (current.hidden) return true;
    const { style } = current;
    if (style && (style.display === 'none' || style.visibility === 'hidden')) return true;
    const parent = current.parentElement;
    if (
      parent !== null &&
      parent.tagName === 'DETAILS' &&
      !parent.hasAttribute('open') &&
      current.tagName !== 'SUMMARY'
    ) {
      return true;
    }
  }
  return false;
}

export default isHiddenBelow;
