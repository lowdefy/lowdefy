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
 * The typed text with `replaceInput` applied, as the web TextInput sanitizes its input.
 *
 * @param {Object} params
 * @param {string} params.text
 * @param {{ pattern: string, flags?: string, replacement?: string }} [params.replaceInput]
 * @returns {string}
 */
function applyReplaceInput({ replaceInput, text }) {
  if (type.isNone(replaceInput)) {
    return text;
  }
  const regex = new RegExp(replaceInput.pattern, replaceInput.flags ?? 'gm');
  return text.replace(regex, replaceInput.replacement ?? '');
}

export default applyReplaceInput;
