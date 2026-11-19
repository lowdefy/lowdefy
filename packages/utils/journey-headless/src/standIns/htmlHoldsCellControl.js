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

// The elements in a Table html cell a click lands on instead of the cell: a link the browser
// runner clicks first (journeyTargetSelectors.interactiveControl), and a data-event element, which
// blocks-antd's isControlTarget keeps from the row and cell events. An <a data-page-id> is a link
// too: HtmlComponent's link enhancer gives it its href after sanitising.
const CELL_CONTROL = 'a[href], a[data-page-id], [data-event]';

// A DOM to read cell html in, made on first use: jsdom takes a moment to load, and most journeys
// click no html cell. DOMPurify sanitises the html as HtmlComponent does in the browser, so an
// `href` it strips (a javascript: URL) is no link here either.
let loading = null;

function loadDom() {
  if (loading === null) {
    loading = Promise.all([import('jsdom'), import('dompurify')]).then(
      ([{ JSDOM }, { default: createDOMPurify }]) => {
        const { window } = new JSDOM('');
        return { document: window.document, purify: createDOMPurify(window) };
      }
    );
  }
  return loading;
}

// Whether a cell's html, as the browser draws it, holds a link or a data-event element.
async function htmlHoldsCellControl(html) {
  const { document, purify } = await loadDom();
  const root = document.createElement('div');
  root.innerHTML = purify.sanitize(html);
  return root.querySelector(CELL_CONTROL) !== null;
}

export default htmlHoldsCellControl;
