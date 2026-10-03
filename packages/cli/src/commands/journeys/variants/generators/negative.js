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

import { translate, type } from '@lowdefy/helpers';
import { getStepKey } from '@lowdefy/node-utils';

import findBlockConfig from '../findBlockConfig.js';
import findSubmitClick from '../findSubmitClick.js';
import writeCall from '../writeCall.js';

// The broken input for one fill: `value: ''` for a required block, whose
// message is the block's required string or the app's default-locale
// engine.validation.fieldRequired; or, for a validate rule, a from: shape
// placeholder, since an operator rule's breaking value cannot be generated.
function breakFill({ block, blockId, i18n }) {
  if (!type.isNone(block.required) && block.required !== false) {
    const message = type.isString(block.required)
      ? block.required
      : translate({ key: 'engine.validation.fieldRequired', i18n });
    return { fill: { blockId, value: '' }, message, detail: `${blockId} left empty` };
  }
  const rule = (block.validate ?? []).find(({ message }) => type.isString(message));
  if (type.isUndefined(rule)) {
    return null;
  }
  return {
    fill: { blockId, value: null, from: 'shape' },
    message: rule.message,
    detail: `${blockId} breaks "${rule.message}"`,
    comment: `Type a value that fails the rule: ${rule.message}`,
  };
}

// Negative: for each fill before the submit click on a block with required
// or a validate rule, the steps up to it, the broken fill, the rest through
// the submit click, then the rule's message shows and the write is never
// sent.
function negative({ journey, exercised, pageConfigs, i18n }) {
  const submit = findSubmitClick({ journey, exercised });
  if (type.isNull(submit)) {
    return { skipped: 'no submit click: no click followed by a wait for a write request' };
  }
  const variants = [];
  journey.steps.slice(0, submit.index).forEach((step, index) => {
    if (getStepKey(step) !== 'fill' || !type.isString(step.fill.blockId)) {
      return;
    }
    const block = findBlockConfig({ pageConfigs, blockId: step.fill.blockId });
    if (type.isNull(block)) {
      return;
    }
    const broken = breakFill({ block, blockId: step.fill.blockId, i18n });
    if (type.isNull(broken)) {
      return;
    }
    const steps = [
      ...journey.steps.slice(0, index),
      { fill: broken.fill },
      ...journey.steps.slice(index + 1, submit.index + 1),
      { expect: { text: { blockId: step.fill.blockId, contains: broken.message } } },
      writeCall({ write: submit.write, count: 0 }),
    ];
    const variant = { kind: 'negative', detail: broken.detail, steps };
    if (!type.isUndefined(broken.comment)) {
      variant.comments = { [index]: broken.comment };
    }
    variants.push(variant);
  });
  if (variants.length === 0) {
    return { skipped: 'no fill before the submit click is on a block with required or validate' };
  }
  return variants;
}

export default negative;
