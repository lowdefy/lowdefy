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
 * Whether the send button is disabled, and the character counter: the send button is disabled
 * while the text is empty, while it sends and while the text is longer than `maxLength`. The
 * counter shows once the text is within a tenth of the limit (400 characters at most) of it.
 *
 * @param {Object} params
 * @param {string} params.value
 * @param {boolean} params.sending
 * @param {number} params.maxLength
 * @returns {{ disabled: boolean, counter: null | { text: string, over: boolean } }}
 */
function getSendState({ value, sending, maxLength }) {
  const text = type.isString(value) ? value : '';
  const over = text.length > maxLength;
  const near = text.length > maxLength - Math.min(400, Math.round(maxLength / 10));
  return {
    disabled: sending === true || text.trim() === '' || over,
    counter: near ? { text: `${text.length}/${maxLength}`, over } : null,
  };
}

export default getSendState;
