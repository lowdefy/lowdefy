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

const LINUX_START_TIME = /^linux:[0-9a-f-]+:\d+$/;

// A start time a reader can compare: epoch milliseconds (macOS, Windows), or the boot id and
// clock ticks since boot that readLinuxProcessStartTime reads on Linux. Anything else - null
// from a failed read, or a format an older Lowdefy wrote - is not one.
function isProcessStartTime(value) {
  return type.isInt(value) || (type.isString(value) && LINUX_START_TIME.test(value));
}

export default isProcessStartTime;
