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

const breakpointKeys = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];

function normalizeClassAndStyles(block, pageContext) {
  // Move properties.style → styles.element (deprecation transform)
  // properties.style is the component's own style, separate from layout wrapper
  if (!type.isNone(block.properties?.style)) {
    if (!block.styles) block.styles = {};
    if (block.styles.element) {
      block.styles.element = { ...block.properties.style, ...block.styles.element };
    } else {
      block.styles.element = block.properties.style;
    }
    delete block.properties.style;
  }

  // Validate no responsive breakpoint keys in style
  if (!type.isNone(block.style) && type.isObject(block.style)) {
    const found = Object.keys(block.style).filter((k) => breakpointKeys.includes(k));
    if (found.length > 0) {
      throw new ConfigError(
        `Block "${block.blockId}": Responsive breakpoint keys (${found.join(', ')}) in "style" are no longer supported. Use CSS classes instead:\n  class: "p-16 sm:p-8"`,
        { configKey: block['~k'] }
      );
    }
  }

  // Normalize style → styles.block (top-level style = layout wrapper)
  if (!type.isNone(block.style)) {
    if (!block.styles) block.styles = {};
    if (block.styles.block) {
      block.styles.block = { ...block.style, ...block.styles.block };
    } else {
      block.styles.block = block.style;
    }
    delete block.style;
  }

  // Normalize class string → { block: value }
  if (type.isString(block.class)) {
    block.class = { block: block.class };
  }
}

export default normalizeClassAndStyles;
