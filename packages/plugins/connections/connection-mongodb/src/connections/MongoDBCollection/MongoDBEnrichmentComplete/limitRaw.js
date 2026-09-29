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

import { BSON } from 'mongodb';

const previewLength = 1000;

// The provider's raw response as it is stored: as it came when it is at most `rawMaxBytes`
// (BSON size), otherwise a marker { _truncated: true, bytes, maxBytes, preview } with the
// first 1000 characters of its JSON, so one large response can not fill the row (a document
// holds at most 16MB) while the details panel still shows what came back.
function limitRaw({ raw, rawMaxBytes }) {
  const bytes = BSON.calculateObjectSize({ raw });
  if (bytes <= rawMaxBytes) return raw;
  return {
    _truncated: true,
    bytes,
    maxBytes: rawMaxBytes,
    preview: JSON.stringify(raw).slice(0, previewLength),
  };
}

export default limitRaw;
