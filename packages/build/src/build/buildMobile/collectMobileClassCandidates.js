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

import { walkValue } from '../collectPageContent.js';
import isMobilePage from './isMobilePage.js';
import walkPageBlocks from './walkPageBlocks.js';

// The class candidates of every block on a mobile or shared page, from the
// same walk the web runs for Tailwind (collectPageContent), so strings inside
// operators count. Strings under "class" are kept apart from strings under
// "properties": an unsupported class fails the build only when it was written
// as a class. Runs before buildJs, which replaces _js source with hashes.
function collectMobileClassCandidates({ components, context }) {
  context.mobileClassCandidates = [];
  (components.pages ?? []).filter(isMobilePage).forEach((page) => {
    walkPageBlocks(page, (block) => {
      const classStrings = [];
      const propertyStrings = [];
      walkValue(block.class, classStrings);
      walkValue(block.properties, propertyStrings);
      if (classStrings.length === 0 && propertyStrings.length === 0) {
        return;
      }
      context.mobileClassCandidates.push({
        pageId: page.pageId,
        blockId: block.blockId,
        configKey: block['~k'],
        classStrings,
        propertyStrings,
      });
    });
  });
  return components;
}

export default collectMobileClassCandidates;
