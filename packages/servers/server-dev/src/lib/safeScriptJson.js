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

// Escape characters that could break out of the enclosing <script> tag or
// terminate a JS string literal. Used to defuse the js/bad-code-sanitization
// class of injection for values embedded into inline scripts and the
// application/json config script.
const SCRIPT_ESCAPES = {
  '<': '\\u003C',
  '>': '\\u003E',
  '\b': '\\b',
  '\f': '\\f',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\0': '\\0',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

function safeScriptJson(value) {
  return JSON.stringify(value).replace(/[<>\b\f\n\r\t\0\u2028\u2029]/g, (c) => SCRIPT_ESCAPES[c]);
}

export default safeScriptJson;
