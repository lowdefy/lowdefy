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

const contextKeys = new WeakMap();
let lastKey = 0;

// A React key per engine context object. A page context rebuilt in place - an
// organization switch, a dev config reset - is a new object under the same
// instance key, and keying the page tree by it remounts the tree onto the new
// context rather than reconciling mounted blocks against it, which React can
// silently drop.
function getContextKey(context) {
  if (!contextKeys.has(context)) {
    lastKey += 1;
    contextKeys.set(context, lastKey);
  }
  return contextKeys.get(context);
}

export default getContextKey;
