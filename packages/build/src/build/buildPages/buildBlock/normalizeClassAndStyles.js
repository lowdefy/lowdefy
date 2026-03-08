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
import { ConfigError } from '@lowdefy/errors';

const breakpointKeys = new Set(['xs', 'sm', 'md', 'lg', 'xl', '2xl']);

// Keys that look like operators (single key starting with _) but are not.
const KNOWN_NON_OPERATORS = new Set(['_id']);

function isOperator(value) {
  const nonTildeKeys = Object.keys(value).filter((k) => !k.startsWith('~'));
  if (nonTildeKeys.length !== 1) return false;
  const key = nonTildeKeys[0];
  const [op] = key.split('.');
  const operator = op.replace(/^(_+)/gm, '_');
  return operator.length > 1 && operator[0] === '_' && !KNOWN_NON_OPERATORS.has(operator);
}

function stripDashPrefix(key) {
  return key.startsWith('--') ? key.slice(2) : key;
}

function normalizeStyle(block) {
  // properties.style → element slot (deprecation: component's own style maps to --element)
  if (!type.isNone(block.properties?.style)) {
    if (!block.style) block.style = {};
    const existing = block.style['--element'];
    block.style['--element'] = existing
      ? { ...block.properties.style, ...existing }
      : block.properties.style;
    delete block.properties.style;
  }

  // Partition plain CSS → block slot, -- keys → strip prefix (single pass)
  if (type.isObject(block.style)) {
    const invalidKeys = Object.keys(block.style).filter(
      (k) => !k.startsWith('--') && breakpointKeys.has(k)
    );
    if (invalidKeys.length > 0) {
      throw new ConfigError(
        `Block "${block.blockId}": Responsive breakpoint keys (${invalidKeys.join(', ')}) in "style" are no longer supported. Use CSS classes instead:\n  class: "p-16 sm:p-8"`,
        { configKey: block['~k'] }
      );
    }

    const result = {};
    const plainCSS = {};
    for (const [key, value] of Object.entries(block.style)) {
      if (key.startsWith('--')) {
        result[stripDashPrefix(key)] = value;
      } else {
        plainCSS[key] = value;
      }
    }
    if (Object.keys(plainCSS).length > 0) {
      result.block = result.block ? { ...plainCSS, ...result.block } : plainCSS;
    }
    block.style = result;

    // Validate no nested objects in style slot values (except operators)
    for (const [slotKey, slotStyle] of Object.entries(block.style)) {
      if (!type.isObject(slotStyle) || isOperator(slotStyle)) continue;
      for (const [cssKey, cssValue] of Object.entries(slotStyle)) {
        if (cssKey.startsWith('~')) continue;
        if (type.isObject(cssValue) && !isOperator(cssValue)) {
          throw new ConfigError(
            `Block "${block.blockId}": Style property "${cssKey}" has a nested object value. CSS properties must be simple values (strings, numbers) or operators.`,
            { configKey: block['~k'] }
          );
        }
      }
    }
  }
}

function normalizeClass(block) {
  if (type.isString(block.class) || type.isArray(block.class)) {
    block.class = { block: block.class };
    return;
  }
  if (type.isObject(block.class) && Object.keys(block.class).some((k) => k.startsWith('--'))) {
    const normalized = {};
    for (const [key, value] of Object.entries(block.class)) {
      normalized[stripDashPrefix(key)] = value;
    }
    block.class = normalized;
  }
}

function normalizeClassAndStyles(block, pageContext) {
  normalizeStyle(block);
  normalizeClass(block);
}

export default normalizeClassAndStyles;
