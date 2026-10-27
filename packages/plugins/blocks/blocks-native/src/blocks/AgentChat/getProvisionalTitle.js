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

const MAX_LENGTH = 60;

/**
 * The name a new thread shows until a better one is made: the person's first message, on one
 * line, cut at a word near 60 characters.
 *
 * @param {string} text The first message.
 * @returns {string|null} null for a message with no text.
 */
function getProvisionalTitle(text) {
  if (!type.isString(text)) return null;
  const line = text.replace(/\s+/g, ' ').trim();
  if (line === '') return null;
  if (line.length <= MAX_LENGTH) return line;
  const cut = line.slice(0, MAX_LENGTH);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > MAX_LENGTH / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export default getProvisionalTitle;
