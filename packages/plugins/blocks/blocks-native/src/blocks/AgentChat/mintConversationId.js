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

import { generateId } from 'ai';
import { type } from '@lowdefy/helpers';

/**
 * The id of a new conversation, minted on the phone as the web block and the ai-assistant module
 * mint theirs: a thread has no stored row until its first message is saved. It starts with the
 * threads' scope, so a stored thread can be traced to where it was started.
 *
 * @param {Object} params
 * @param {string} [params.scope]
 * @returns {string}
 */
function mintConversationId({ scope }) {
  const prefix = type.isString(scope) && scope !== '' ? scope : 'chat';
  return `${prefix}_${Date.now()}${generateId()}`;
}

export default mintConversationId;
