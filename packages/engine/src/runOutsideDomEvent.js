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

import outsideDomEventScope from './outsideDomEventScope.js';

// Runs the synchronous part of an action call outside DOM event claiming. An action can run
// inside the DOM event that fired it (a Button click running CallMethod), and events it fires on
// other blocks (the called block's own events) are caused by the handled event, not copies of it
// bubbling through the blocks around the target.
function runOutsideDomEvent(fn) {
  outsideDomEventScope.depth += 1;
  try {
    return fn();
  } finally {
    outsideDomEventScope.depth -= 1;
  }
}

export default runOutsideDomEvent;
