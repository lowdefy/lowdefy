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

import loadHtmlDom from './standIns/loadHtmlDom.js';
import readNodeText from './readNodeText.js';

// The text an html label shows in a browser, which the browser runner's select matches an option
// by: blocks-antd draws a Selector's or a radio group's option label as html (renderHtml), so
// '<span class="dot"></span><span>No space</span>' shows "No space" and "Sales &amp; Ops" shows
// "Sales & Ops". A label with no tag or entity is its own text, and needs no DOM.
async function readHtmlText(label) {
  if (!/[<&]/.test(label)) {
    return label;
  }
  const parse = await loadHtmlDom();
  return readNodeText(parse(label));
}

export default readHtmlText;
