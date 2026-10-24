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

const SHELL_VERSION = /lowdefy-shell@([^\s"]+)/;

// The shell version in an update's message (createUpdateMessage.js), or null
// for a message without one. eas update:list quotes the message and adds when
// and by whom, so it is matched anywhere in the text.
function parseShellVersion(message) {
  if (!type.isString(message)) {
    return null;
  }
  return message.match(SHELL_VERSION)?.[1] ?? null;
}

export default parseShellVersion;
