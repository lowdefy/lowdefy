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
import { ConfigWarning } from '@lowdefy/errors';

function isOperator(value) {
  if (!type.isObject(value)) return false;
  const nonTildeKeys = Object.keys(value).filter((k) => !k.startsWith('~'));
  if (nonTildeKeys.length !== 1) return false;
  const [op] = nonTildeKeys[0].split('.');
  const operator = op.replace(/^(_+)/gm, '_');
  return operator.length > 1 && operator[0] === '_';
}

function validateCssKeys(block, pageContext) {
  const blockMeta = pageContext.context.blockMetas?.[block.type];
  if (!blockMeta) return;
  if (blockMeta.cssKeys === false) return;

  const validKeys = new Set(['block', ...(blockMeta.cssKeys ?? ['element'])]);

  if (type.isObject(block.style) && !isOperator(block.style)) {
    for (const key of Object.keys(block.style)) {
      if (key.startsWith('~')) continue;
      if (!validKeys.has(key)) {
        pageContext.context.handleWarning(
          new ConfigWarning(
            `Block "${block.blockId}" (${block.type}): Unknown CSS key "--${key}" in "style". Valid keys: ${[...validKeys].map((k) => `--${k}`).join(', ')}.`,
            { configKey: block['~k'] }
          )
        );
      }
    }
  }
  if (type.isObject(block.class) && !isOperator(block.class)) {
    for (const key of Object.keys(block.class)) {
      if (key.startsWith('~')) continue;
      if (!validKeys.has(key)) {
        pageContext.context.handleWarning(
          new ConfigWarning(
            `Block "${block.blockId}" (${block.type}): Unknown CSS key "--${key}" in "class". Valid keys: ${[...validKeys].map((k) => `--${k}`).join(', ')}.`,
            { configKey: block['~k'] }
          )
        );
      }
    }
  }
}

export default validateCssKeys;
