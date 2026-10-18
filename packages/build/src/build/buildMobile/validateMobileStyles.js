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
import { convertStyle } from '@lowdefy/style-native';

import collectExceptions from '../../utils/collectExceptions.js';
import isMobilePage from './isMobilePage.js';
import walkPageBlocks from './walkPageBlocks.js';

function isOperator(value) {
  return getOperatorType(value) !== null;
}

function literalEntries(slotStyle) {
  return Object.fromEntries(Object.entries(slotStyle).filter(([, value]) => !isOperator(value)));
}

// Checks every literal style on mobile and shared pages with the converter the
// shell uses, and fails the build on keys React Native cannot honour, naming
// the page, block, slot and key. Runs on block.style as normalizeClassAndStyles
// leaves it: keyed by slot ("block", "element", "label").
//
// Mobile-only pages are converted in place, since the web never renders them.
// A slot is converted only when it holds no operator: a slot that is an
// operator, or has an operator value, is converted whole by the shell after
// its operators run. Shared pages are checked but not converted, because the
// web reads the same page JSON; the shell converts their styles too.
function validateMobileStyles({ components, context }) {
  (components.pages ?? []).filter(isMobilePage).forEach((page) => {
    walkPageBlocks(page, (block) => {
      if (!type.isObject(block.style) || isOperator(block.style)) {
        return;
      }
      Object.entries(block.style).forEach(([slot, slotStyle]) => {
        if (slot.startsWith('~') || !type.isObject(slotStyle) || isOperator(slotStyle)) {
          return;
        }
        const literals = literalEntries(slotStyle);
        const { style, errors } = convertStyle(literals);
        errors.forEach((error) => {
          collectExceptions(
            context,
            new ConfigError(
              `Style "${error.key}" in slot "${slot}" on block "${block.blockId}" on page "${page.pageId}" is not supported on mobile. ${error.message}`,
              { configKey: slotStyle['~k'] ?? block['~k'] }
            )
          );
        });
        const hasOperators = Object.keys(literals).length !== Object.keys(slotStyle).length;
        if (page.target === 'mobile' && !hasOperators && errors.length === 0) {
          block.style[slot] = style;
        }
      });
    });
  });
  return components;
}

export default validateMobileStyles;
