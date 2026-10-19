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

// A person or org id as `p_`/`o_` plus the first 16 hex characters of its
// HMAC-SHA256 under the machine's salt. The same machine always gives the same
// hash, and every count the loop reports is a distinct count, which no salt
// changes.
function hashId({ salt, id, prefix }) {
  if (type.isNone(id) || id === '') return null;
  const digest = crypto.createHmac('sha256', salt).update(String(id)).digest('hex');
  return `${prefix}${digest.slice(0, 16)}`;
}

export default hashId;
