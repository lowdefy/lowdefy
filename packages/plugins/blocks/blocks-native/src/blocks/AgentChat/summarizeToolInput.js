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

function quote(value) {
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text.length > MAX_LENGTH ? `“${text.slice(0, MAX_LENGTH)}…”` : `“${text}”`;
}

/**
 * The one line under a running tool call: the values it was called with, such as
 * `“payroll” · PEL` for a search. Only the input's top-level strings and numbers are read; a call
 * with none says it is running.
 *
 * @param {Object} params
 * @param {*} params.input The tool's input, which may still be streaming in.
 * @param {Function} params.translate
 * @returns {string}
 */
function summarizeToolInput({ input, translate }) {
  if (!type.isObject(input)) return translate('agent.toolResult.running');
  const values = Object.values(input).filter(
    (value) => (type.isString(value) && value.trim() !== '') || type.isNumber(value)
  );
  if (values.length === 0) return translate('agent.toolResult.running');
  return values.slice(0, 2).map(quote).join(' · ');
}

export default summarizeToolInput;
