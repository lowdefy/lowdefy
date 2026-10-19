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

// Each script and style element in app.html.appendHead / appendBody gets the
// render's nonce, so author snippets keep running under the policy. Matching
// whole elements (up to the first closing tag, as the HTML parser does) leaves
// "<script" text inside a script body untouched.
const ELEMENT_PATTERN = /<(script|style)\b([^>]*)>([\s\S]*?)<\/\1(\s*)>/gi;

function addNonceToElements({ html, nonce }) {
  return html.replace(
    ELEMENT_PATTERN,
    (_, tag, attributes, body, closingSpace) =>
      `<${tag} nonce="${nonce}"${attributes}>${body}</${tag}${closingSpace}>`
  );
}

export default addNonceToElements;
