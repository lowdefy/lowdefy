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

import HTML_LABEL_TYPES from './HTML_LABEL_TYPES.js';
import loadHtmlDom from './standIns/loadHtmlDom.js';

// block-utils' html enhancers that write an element's text in the browser: data-avatar writes
// initials, data-format a formatted number, data-time a date or relative time. A label that uses
// one shows text its html does not hold, so a headless select cannot read what the browser
// matches.
const TEXT_WRITING_ENHANCERS = '[data-avatar], [data-format], [data-time]';

// Why a select on the block needs the browser: one of its html labels uses an enhancer that writes
// its text. null when the block draws plain labels or none of its labels does.
async function findTextWritingLabel({ actor, block }) {
  if (!HTML_LABEL_TYPES.has(block.type)) {
    return null;
  }
  const parse = await loadHtmlDom();
  const written = actor.stepRunner
    .optionLabels({ block })
    .some(
      (label) =>
        label.includes('data-') && parse(label).querySelector(TEXT_WRITING_ENHANCERS) !== null
    );
  if (!written) {
    return null;
  }
  return `Block "${block.blockId}" (${block.type}) has an option label whose text data-avatar, data-format or data-time writes in the browser, which a headless select does not model: the step runs in a browser.`;
}

export default findTextWritingLabel;
