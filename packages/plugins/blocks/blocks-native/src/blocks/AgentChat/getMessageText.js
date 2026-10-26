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

import { isCommentaryPart } from './messageParts.js';

/**
 * A message's answer text, for Copy and the events that report it: its text parts, one paragraph
 * each. A model's commentary (OpenAI's preamble before a tool call) is reasoning, not answer.
 *
 * @param {Object} message A UI message.
 * @returns {string}
 */
function getMessageText(message) {
  return (message?.parts ?? [])
    .filter((part) => part.type === 'text' && !isCommentaryPart(part))
    .map((part) => (part.text ?? '').trim())
    .filter((text) => text !== '')
    .join('\n\n');
}

export default getMessageText;
