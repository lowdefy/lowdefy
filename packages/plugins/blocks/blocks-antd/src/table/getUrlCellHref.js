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

import { getSafeHref } from '@lowdefy/block-utils';

// Anything that already names a scheme or reads as a path, query or fragment.
const notBareDomainPattern = /^([a-z][a-z0-9+.-]*:|[/?#.\\])/i;

// The href for a `url` cell, or undefined when the value must not become a
// link. A url cell holds an address on another site, so a bare domain like
// `lowdefy.com` gets https:// rather than being read relative to the page.
function getUrlCellHref(value) {
  const text = String(value).trim();
  if (text === '') return undefined;
  if (notBareDomainPattern.test(text)) return getSafeHref(text);
  return getSafeHref(`https://${text}`);
}

export default getUrlCellHref;
