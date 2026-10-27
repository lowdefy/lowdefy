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

import isMobilePage from './isMobilePage.js';
import walkPageBlocks from './walkPageBlocks.js';

// Whether config sets a value at a nativeIgnored path: dotted keys, with `$` for any item of an
// array. A key holding an operator counts as set; a path below an operator is not followed.
function isSet({ value, segments }) {
  if (segments.length === 0) {
    return !type.isNone(value);
  }
  const [segment, ...rest] = segments;
  if (segment === '$') {
    return type.isArray(value) && value.some((item) => isSet({ value: item, segments: rest }));
  }
  if (!type.isObject(value)) {
    return false;
  }
  return isSet({ value: value[segment], segments: rest });
}

// A native block accepts the web properties a phone cannot honour (its meta marks them
// `nativeIgnored`, and extractBlockTypes lists their paths in the block meta), so a page shared
// with the web stays valid. The build warns when a mobile or shared page sets one: once per page
// for each block type and property, naming the page, the first block that sets it and the
// property. Runs after buildPages, as validateMobileStyles does.
function validateNativeIgnoredProperties({ components, context }) {
  const blockMetas = context.blockMetasMobile ?? {};
  (components.pages ?? []).filter(isMobilePage).forEach((page) => {
    const warned = new Set();
    walkPageBlocks(page, (block) => {
      const paths = blockMetas[block.type]?.nativeIgnored;
      if (!type.isArray(paths) || !type.isObject(block.properties)) {
        return;
      }
      paths.forEach((path) => {
        const key = `${block.type}:${path}`;
        if (warned.has(key) || !isSet({ value: block.properties, segments: path.split('.') })) {
          return;
        }
        warned.add(key);
        context.handleWarning(
          new ConfigWarning(
            `Property "${path}" on block "${block.blockId}" (${block.type}) on page "${page.pageId}" is ignored on mobile.`,
            { configKey: block['~k'], checkSlug: 'native-ignored' }
          )
        );
      });
    });
  });
  return components;
}

export default validateNativeIgnoredProperties;
