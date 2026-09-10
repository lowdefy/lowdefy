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

// Cap the serialized response so a large request or endpoint result can't blow
// out an agent's context window.
const MAX_RESPONSE_CHARS = 100_000;

// Returns the result untouched when its response fits, otherwise the same
// result with the response replaced by a serialized prefix plus a
// truncated flag and a note carrying the original size, so an agent knows it
// is reading a partial value rather than the real shape.
function truncateResponse(result) {
  const json = JSON.stringify(result.response);
  if (json.length <= MAX_RESPONSE_CHARS) {
    return result;
  }
  return {
    ...result,
    response: json.slice(0, MAX_RESPONSE_CHARS),
    truncated: true,
    note: `Response truncated to ${MAX_RESPONSE_CHARS} characters (original serialized size: ${json.length} characters).`,
  };
}

export { MAX_RESPONSE_CHARS };
export default truncateResponse;
