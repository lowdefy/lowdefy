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

// A DOM to read a block's html in, made on first use: jsdom takes a moment to load, and most
// journeys read no html. DOMPurify sanitises the html as HtmlComponent does in the browser, so
// what it strips (a javascript: URL, an inline handler) is not there either.
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

// Resolves parse(html): the html as HtmlComponent draws it, in a detached root element, and
// parse.sanitize(text), DOMPurify's string. parse is synchronous, so a check that polls can read
// the html again on each try.
async function loadHtmlDom() {
  const { document, purify } = await loadDom();
  function parse(html) {
    const root = document.createElement('div');
    root.innerHTML = purify.sanitize(html);
    return root;
  }
  // DangerousMarkdown sanitises its markdown as a string before react-markdown reads it.
  parse.sanitize = (text) => purify.sanitize(text);
  return parse;
}

export default loadHtmlDom;
