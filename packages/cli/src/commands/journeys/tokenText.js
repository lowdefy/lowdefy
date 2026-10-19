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

import crypto from 'crypto';
import { type } from '@lowdefy/helpers';

// A production click's text as `t_` plus the first 16 hex characters of its
// HMAC-SHA256 under the machine's trace salt. The text is already
// whitespace-collapsed and trimmed (normaliseClickText). The `text:` input
// prefix and the `t_` output prefix keep a token from ever equalling a
// `p_`/`o_` person or org hash. The same text on one machine always gives the
// same token, so clicks group and count without the text; readers turn a
// token back into text only when it is the token of a config string.
function tokenText({ salt, text }) {
  if (type.isNone(text) || text === '') return null;
  const digest = crypto.createHmac('sha256', salt).update(`text:${text}`).digest('hex');
  return `t_${digest.slice(0, 16)}`;
}

export default tokenText;
