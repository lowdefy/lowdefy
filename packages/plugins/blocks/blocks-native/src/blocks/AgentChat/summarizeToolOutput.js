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

const MAX_LENGTH = 80;

/**
 * The one line under a finished tool call, as the web block's summary: how many results, which
 * fields, or the start of a text answer.
 *
 * @param {Object} params
 * @param {*} params.output The tool's output.
 * @param {Function} params.translate
 * @returns {string}
 */
function summarizeToolOutput({ output, translate }) {
  if (type.isNone(output)) return translate('agent.toolResult.completedNoData');
  if (type.isArray(output)) {
    return translate('agent.toolResult.returnedCount', { count: output.length });
  }
  if (type.isObject(output)) {
    const keys = Object.keys(output);
    if (keys.length <= 3) {
      return translate('agent.toolResult.returnedKeys', { keys: keys.join(', ') });
    }
    return translate('agent.toolResult.returnedFields', { count: keys.length });
  }
  if (type.isString(output)) {
    const line = output.replace(/\s+/g, ' ').trim();
    return line.length > MAX_LENGTH ? `${line.slice(0, MAX_LENGTH)}…` : line;
  }
  return String(output);
}

export default summarizeToolOutput;
