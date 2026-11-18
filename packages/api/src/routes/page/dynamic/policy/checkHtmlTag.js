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

const HTML_TAG = /<[a-zA-Z/!]/;

// The html rule: without policy.html, no string the client may draw as HTML
// holds tag syntax. A string drawn as escaped text shows tag syntax as written.
// subject names what the string is in the message ("String" or "Key").
function checkHtmlTag({ value, path, textKind, subject, walk }) {
  const { errors, policy } = walk;
  if (policy.html || textKind === 'text' || !HTML_TAG.test(value)) {
    return;
  }
  errors.push({
    path,
    rule: 'policy.html',
    message: `${subject} contains HTML tag syntax. Dynamic blocks policy "${policy.id}" does not allow HTML.`,
  });
}

export default checkHtmlTag;
