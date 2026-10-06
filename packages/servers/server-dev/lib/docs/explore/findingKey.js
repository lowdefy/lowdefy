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

import crypto from 'node:crypto';

// One finding per (kind, page, source location), or per message when there
// is no location: the explorer de-duplicates across walks and roles by it,
// and a journey proves the finding only by failing with the same key.
function findingKey({ kind, pageId, source, message }) {
  const where =
    source ??
    `message:${crypto.createHash('sha1').update(String(message)).digest('hex').slice(0, 8)}`;
  return [kind, pageId ?? '', where].join('|');
}

export default findingKey;
