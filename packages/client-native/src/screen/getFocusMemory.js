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

const memories = new WeakMap();

// A Screen's focus memory lives as long as its page context, not as long as the Screen's own
// component: the page tree is mounted again onto a kept context (a new page version, a rebuilt
// screen), and a focus the screen already had must not fire onFocus again then. A new context (a
// new page instance) starts with none.
function getFocusMemory(context) {
  if (!memories.has(context)) {
    memories.set(context, { focused: false, shown: false });
  }
  return memories.get(context);
}

export default getFocusMemory;
