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

import { type } from '@lowdefy/helpers';

// Only http(s) and mailto links become PDF link annotations. A javascript:,
// file: or vbscript: scheme in a /URI action is a phishing or local-open vector
// in some viewers, so such links render as plain text.
const SAFE_LINK_SCHEME = /^(https?:|mailto:)/i;

function safeLinkUrl(url) {
  if (!type.isString(url)) return undefined;
  return SAFE_LINK_SCHEME.test(url.trim()) ? url : undefined;
}

export default safeLinkUrl;
