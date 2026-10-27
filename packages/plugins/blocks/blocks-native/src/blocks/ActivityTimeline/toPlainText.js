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

/**
 * A comment body as a person copies it: each mention token as "@Name".
 *
 * @param {Object} params
 * @param {string} params.body
 * @param {Array<{ user_id: string, name: string }>} [params.mentions]
 * @param {Map<string, { label: string }>} [params.people]
 * @param {RegExp} params.pattern A global mention pattern (createMentionPattern).
 * @returns {string}
 */
function toPlainText({ body, mentions, people, pattern }) {
  const named = new Map((mentions ?? []).map((mention) => [mention.user_id, mention.name]));
  return (type.isString(body) ? body : '').replace(
    pattern,
    (token, id) => `@${named.get(id) ?? people?.get(id)?.label ?? 'Unknown'}`
  );
}

export default toPlainText;
