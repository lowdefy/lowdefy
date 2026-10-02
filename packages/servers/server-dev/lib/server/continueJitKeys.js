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

import { makeId } from '@lowdefy/build/dev';

// JIT keys extend the config build's prefix with the dev server process's id, so
// they never repeat a key of that build, of an earlier config build, or of another
// process serving the same config build (a restarted server continues the build
// the one before it served). Within a process the counter only moves forward, so
// a recreated build context never repeats an earlier page build's key.
function continueJitKeys({ idCounter, childId }) {
  makeId.continueFrom({ prefix: `${idCounter.prefix}${childId}_`, counter: 0 });
}

export default continueJitKeys;
