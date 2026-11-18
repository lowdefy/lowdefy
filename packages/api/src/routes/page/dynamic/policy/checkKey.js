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

import checkHtmlTag from './checkHtmlTag.js';
import checkTextUrls from './checkTextUrls.js';

// A block can draw an object key, not only a value: Descriptions draws the keys
// of an items object as labels, Tabs and Collapse draw slot names as titles,
// both through renderHtml. No schema marks how a key is drawn, so a key keeps
// every check a string no schema marks gets: the html rule and every URL scan.
// path is the path of the key's value, which names the key.
function checkKey({ key, path, walk }) {
  // Data is stored or sent, never drawn or followed by the content.
  if (walk.isData) {
    return;
  }
  checkHtmlTag({ value: key, path, textKind: null, subject: 'Key', walk });
  checkTextUrls({ value: key, path, textKind: null, walk });
}

export default checkKey;
