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

import getReadableRows from './getReadableRows.js';
import getToolIcon from './getToolIcon.js';
import humanizeToolName from './humanizeToolName.js';
import { getToolInfo } from './messageParts.js';
import summarizeToolInput from './summarizeToolInput.js';
import summarizeToolOutput from './summarizeToolOutput.js';

function getStatus(part) {
  switch (part.state) {
    case 'output-available':
      return 'done';
    case 'output-error':
      return 'error';
    case 'output-denied':
      return 'denied';
    case 'approval-requested':
      return type.isString(part.approval?.id) ? 'approval' : 'running';
    default:
      return 'running';
  }
}

function getSummary({ config, input, output, status, part, translate }) {
  switch (status) {
    case 'approval':
      return translate('agent.toolResult.waitingApproval');
    case 'denied':
      return translate('agent.toolResult.rejected');
    case 'error':
      return type.isString(part.errorText) && part.errorText !== ''
        ? part.errorText
        : translate('agent.toolResult.failed');
    case 'running':
      if (config?.showToolInputStreaming === false) return translate('agent.toolResult.running');
      return summarizeToolInput({ input, translate });
    default:
      if (type.isString(output?.display))
        return summarizeToolOutput({ output: output.display, translate });
      if (output?._subAgent === true) return translate('agent.toolResult.completed');
      return summarizeToolOutput({ output, translate });
  }
}

/**
 * What a tool call's card shows, from its message part: the readable name and glyph, its status
 * (running, waiting for approval, done, failed, rejected), a one-line summary as the web block's,
 * and what the card shows expanded: a markdown `display` the tool returned, a sub-agent's answer,
 * or the output as readable rows (getReadableRows). toolResultDisplay `none` shows no detail and
 * `full` the output as JSON.
 *
 * @param {Object} params
 * @param {Object} [params.config] The messageDisplay property.
 * @param {Object} params.part The tool's UI message part.
 * @param {Function} params.translate
 * @returns {Object}
 */
function describeToolPart({ config, part, translate }) {
  const tool = getToolInfo(part);
  const status = getStatus(part);
  const isSubAgent = tool.output?._subAgent === true;
  const output = isSubAgent ? tool.output.text : tool.output;
  const description = {
    approvalId: status === 'approval' ? part.approval.id : null,
    icon: getToolIcon({ isSubAgent, toolName: tool.toolName }),
    id: tool.toolCallId,
    input: tool.input,
    status,
    summary: getSummary({
      config,
      input: tool.input,
      output: tool.output,
      status,
      part,
      translate,
    }),
    title: humanizeToolName(tool.toolName),
    toolName: tool.toolName,
    detail: null,
  };
  if (status !== 'done') {
    return description;
  }
  const mode = type.isObject(config?.toolResultDisplay)
    ? config.toolResultDisplay[tool.toolName] ?? config.toolResultDisplay.default ?? 'summary'
    : config?.toolResultDisplay ?? 'summary';
  if (mode === 'none') {
    return description;
  }
  if (type.isString(output?.display)) {
    description.detail = { kind: 'markdown', text: output.display };
  } else if (isSubAgent) {
    description.detail = {
      kind: 'markdown',
      text: type.isString(output) ? output : JSON.stringify(output, null, 2),
    };
  } else if (mode === 'full') {
    description.detail = { kind: 'json', text: JSON.stringify(output, null, 2) };
  } else {
    description.detail = { kind: 'rows', rows: getReadableRows({ output, translate }) };
  }
  return description;
}

export default describeToolPart;
