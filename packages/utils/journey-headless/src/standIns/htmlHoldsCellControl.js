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

import loadHtmlDom from './loadHtmlDom.js';

// The elements in a Table html cell a click lands on instead of the cell: a link the browser
// runner clicks first (journeyTargetSelectors.interactiveControl), and a data-event element, which
// blocks-antd's isControlTarget keeps from the row and cell events. An <a data-page-id> is a link
// too: HtmlComponent's link enhancer gives it its href after sanitising.
const CELL_CONTROL = 'a[href], a[data-page-id], [data-event]';

// Whether a cell's html, as the browser draws it, holds a link or a data-event element.
async function htmlHoldsCellControl(html) {
  const parse = await loadHtmlDom();
  return parse(html).querySelector(CELL_CONTROL) !== null;
}

export default htmlHoldsCellControl;
