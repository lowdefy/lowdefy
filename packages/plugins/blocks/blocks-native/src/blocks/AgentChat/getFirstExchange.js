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

import getMessageText from './getMessageText.js';

function oneLine(text) {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * The opening question and reply of a thread whose first reply has just landed, for the
 * ai-assistant module's title-thread endpoint, which names the thread from both. null on any
 * later turn, and once the person renamed the thread (its title is no longer the provisional
 * one), since that name is theirs.
 *
 * @param {Object} params
 * @param {Object[]} params.messages
 * @param {string|null} params.provisionalTitle
 * @param {string|null} params.title
 * @returns {{ prompt: string, reply: string, replaces: string }|null}
 */
function getFirstExchange({ messages, provisionalTitle, title }) {
  const assistants = messages.filter((message) => message.role === 'assistant');
  if (assistants.length !== 1) return null;
  if (title === null || title !== provisionalTitle) return null;
  const prompt = oneLine(getMessageText(messages.find((message) => message.role === 'user')));
  const reply = oneLine(getMessageText(assistants[0]));
  if (prompt === '' && reply === '') return null;
  return { prompt, reply, replaces: title };
}

export default getFirstExchange;
