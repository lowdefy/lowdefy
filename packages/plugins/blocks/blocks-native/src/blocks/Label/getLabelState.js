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

const VALIDATION_MESSAGE_KEYS = {
  error: 'errors',
  warning: 'warnings',
};

// The label title as the web Label picks it: the title, or the block id when there is no title,
// and nothing for an empty title or a disabled label. A trailing colon the config wrote is
// trimmed when the label adds its own.
function getTitle({ blockId, properties }) {
  if (properties.disabled === true) return null;
  const title = type.isString(properties.title) ? properties.title : blockId;
  if (title.trim() === '') return null;
  if (properties.colon !== false) {
    return title.replace(/[:|：]\s*$/u, '');
  }
  return title;
}

/**
 * What an input's label shows, as the web Label decides it: the title, whether a colon follows
 * it, and the line under the input, which is the first validation message when validation
 * failed and the label's `extra` text otherwise.
 *
 * @param {Object} params
 * @param {string} params.blockId
 * @param {Object} params.properties The label properties: the input's `title` with its `label`
 *   object over it.
 * @param {Object} [params.validation] The engine's `{ status, errors, warnings }`.
 * @returns {{ title: string|null, colon: boolean, feedback: string|null, extra: string|null }}
 */
function getLabelState({ blockId, properties, validation }) {
  const status = validation?.status ?? null;
  const showFeedback =
    properties.hasFeedback !== false && (status === 'error' || status === 'warning');
  const showExtra = type.isString(properties.extra) && (status === null || status === 'success');
  const feedback = showFeedback ? validation[VALIDATION_MESSAGE_KEYS[status]]?.[0] ?? null : null;
  return {
    title: getTitle({ blockId, properties }),
    // A label above its input is a heading; antd shows the colon only beside the input.
    colon: properties.inline === true && properties.colon !== false,
    feedback,
    extra: showExtra ? properties.extra : null,
  };
}

export default getLabelState;
