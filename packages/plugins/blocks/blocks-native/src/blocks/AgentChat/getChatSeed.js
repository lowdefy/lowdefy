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

function nonEmptyString(value) {
  return type.isString(value) && value.trim() !== '' ? value : null;
}

/**
 * What a new chat starts with, from the `seed` property or the newChat method's args, so a page
 * can start a chat about a record: the shared state merged under the page's `sharedState` for
 * this conversation, the welcome laid over the `welcome` property, the composer filled with the
 * input, and, with `threads`, the tag and title saved onto the thread. Null when it names none
 * of them, for a plain new chat.
 *
 * @param {Object} [seed] `{ sharedState, welcome, input, tag, title }`.
 * @returns {{ input: string|null, sharedState: Object|null, tag: string|null, title: string|null, welcome: Object|null } | null}
 */
function getChatSeed(seed) {
  if (!type.isObject(seed)) {
    return null;
  }
  const chatSeed = {
    input: nonEmptyString(seed.input),
    sharedState:
      type.isObject(seed.sharedState) && Object.keys(seed.sharedState).length > 0
        ? seed.sharedState
        : null,
    tag: nonEmptyString(seed.tag),
    title: nonEmptyString(seed.title),
    welcome: type.isObject(seed.welcome) ? seed.welcome : null,
  };
  if (Object.values(chatSeed).every((value) => value === null)) {
    return null;
  }
  return chatSeed;
}

export default getChatSeed;
