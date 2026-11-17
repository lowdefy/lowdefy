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

import findEmbeddedUrls from './findEmbeddedUrls.js';
import findHtmlUrls from './findHtmlUrls.js';
import isAllowedUrl from './isAllowedUrl.js';

// Which URLs a string can carry depends on how its block draws it (textKind,
// from the block schema). Text and HTML a block draws are no link and render no
// markdown, so a whole value, a markdown target or a protocol-relative word in
// them is words. HTML can carry a style, a link or a source attribute only when
// the policy allows tags (findHtmlUrls). A string no schema marks may be drawn
// as markdown, a style or a link the schema does not mark, so every scan applies.
function getUrlScans({ textKind, policy }) {
  if (textKind === 'text') {
    return { wholeValue: false, markdown: false, css: false };
  }
  if (textKind === 'html') {
    return { wholeValue: false, markdown: false, css: policy.html === true };
  }
  return { wholeValue: true, markdown: true, css: true };
}

// Searches a string that is not itself a URL value for the URLs it can make
// the client load or navigate to, and reports each one the policy does not allow.
function checkTextUrls({ value, path, textKind, walk }) {
  const { errors, policy, routes } = walk;
  findEmbeddedUrls({ value, ...getUrlScans({ textKind, policy }) }).forEach((url) => {
    if (!isAllowedUrl({ value: url, policy, navigation: false, schemeless: false, routes })) {
      errors.push({
        path,
        rule: 'policy.urls',
        message: `URL "${url}" is not an origin dynamic blocks policy "${policy.id}" allows.`,
      });
    }
  });
  // With tags allowed, any string a block may draw as HTML can carry a link or
  // a source in an attribute.
  if (policy.html === true && textKind !== 'text') {
    findHtmlUrls({ value }).forEach(({ url, navigation }) => {
      if (!isAllowedUrl({ value: url, policy, navigation, schemeless: false, routes })) {
        errors.push({
          path,
          rule: 'policy.urls',
          message: `HTML attribute URL "${url}" is not a page or origin dynamic blocks policy "${policy.id}" allows.`,
        });
      }
    });
  }
}

export default checkTextUrls;
