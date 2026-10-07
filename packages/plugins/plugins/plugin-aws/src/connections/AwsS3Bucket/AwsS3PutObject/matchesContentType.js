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

// A pattern is a media type ("image/png"), a type with any subtype ("image/*") or "*/*".
function matchesContentType({ pattern, mediaType }) {
  const wanted = pattern.trim().toLowerCase();
  if (wanted === '*/*') return true;
  if (wanted.endsWith('/*')) return mediaType.startsWith(wanted.slice(0, -1));
  return mediaType === wanted;
}

export default matchesContentType;
