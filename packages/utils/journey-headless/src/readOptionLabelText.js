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
import readHtmlText from './readHtmlText.js';

// The step runner's readLabelText: the text an option's label shows in the browser. A block that
// draws its labels as html (HTML_LABEL_TYPES) shows the html's text; any other shows the label as
// written, so an AutoComplete option "<Other>" is picked by "<Other>".
function readOptionLabelText({ block, label }) {
  if (!HTML_LABEL_TYPES.has(block.type)) {
    return label;
  }
  return readHtmlText(label);
}

export default readOptionLabelText;
