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

import { getOperatorType, type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

const breakpointKeys = new Set(['xs', 'sm', 'md', 'lg', 'xl', '2xl']);

function isOperator(value) {
  return getOperatorType(value) !== null;
}

function stripDotPrefix(key) {
  return key.startsWith('.') ? key.slice(1) : key;
}

function getCssKeyNames(block, pageContext) {
  const blockMeta = pageContext?.context?.blockMetas?.[block.type];
  if (!blockMeta?.cssKeys) return new Set();
  return new Set(Object.keys(blockMeta.cssKeys));
}

function normalizeStyle(block, pageContext) {
  // properties.style → element slot (deprecation: component's own style maps to .element)
  if (!type.isNone(block.properties?.style)) {
    if (!block.style) block.style = {};
    const existing = block.style['.element'];
    block.style['.element'] = existing
      ? { ...block.properties.style, ...existing }
      : block.properties.style;
    delete block.properties.style;
  }

  // Partition plain CSS → block slot, . keys → strip prefix (single pass)
  if (type.isObject(block.style)) {
    const invalidKeys = Object.keys(block.style).filter(
      (k) => !k.startsWith('.') && breakpointKeys.has(k)
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
      if (key.startsWith('.')) {
        result[stripDotPrefix(key)] = value;
      } else {
        plainCSS[key] = value;
      }
    }
    if (Object.keys(plainCSS).length > 0) {
      result.block = result.block ? { ...plainCSS, ...result.block } : plainCSS;
    }
    block.style = result;

    // Validate no nested objects in style slot values (except operators)
    const validCssKeys = getCssKeyNames(block, pageContext);
    for (const [slotKey, slotStyle] of Object.entries(block.style)) {
      if (!type.isObject(slotStyle) || isOperator(slotStyle)) continue;
      for (const [cssKey, cssValue] of Object.entries(slotStyle)) {
        if (cssKey.startsWith('~')) continue;
        if (type.isObject(cssValue) && !isOperator(cssValue)) {
          const hint = validCssKeys.has(cssKey)
            ? ` Did you mean ".${cssKey}"? Use a dot prefix to target CSS slot keys.`
            : '';
          throw new ConfigError(
            `Block "${block.blockId}": Style property "${cssKey}" has a nested object value.${hint} CSS properties must be simple values (strings, numbers) or operators.`,
            { configKey: block['~k'] }
          );
        }
      }
    }
  }
}

function normalizeClass(block, pageContext) {
  // An operator at the root of `class` computes the block's classes at runtime.
  // Its result reaches cn() (clsx + twMerge), so a string, an array of strings,
  // or a { className: boolean } object all work. Returning early skips the
  // cssKeys check and the dot-prefix strip, which would corrupt the operator.
  if (type.isObject(block.class) && isOperator(block.class)) {
    block.class = { block: block.class };
    return;
  }
  if (type.isString(block.class) || type.isArray(block.class)) {
    block.class = { block: block.class };
    return;
  }
  if (!type.isObject(block.class)) return;

  // Validate: non-dot keys that match cssKeys are likely missing the dot prefix
  const validCssKeys = getCssKeyNames(block, pageContext);
  for (const key of Object.keys(block.class)) {
    if (!key.startsWith('.') && !key.startsWith('~') && validCssKeys.has(key)) {
      throw new ConfigError(
        `Block "${block.blockId}": Class key "${key}" matches a CSS slot key but is missing the dot prefix. Did you mean ".${key}"?`,
        { configKey: block['~k'] }
      );
    }
  }

  // Strip dot prefixes
  const normalized = {};
  for (const [key, value] of Object.entries(block.class)) {
    normalized[stripDotPrefix(key)] = value;
  }
  block.class = normalized;
}

function normalizeClassAndStyles(block, pageContext) {
  normalizeStyle(block, pageContext);
  normalizeClass(block, pageContext);
}

export default normalizeClassAndStyles;
