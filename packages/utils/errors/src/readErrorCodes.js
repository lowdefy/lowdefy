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

// One rule over the conventions libraries already follow, instead of a
// per-driver table that goes stale: Node system errors, Postgres and Mongo set
// `code`; axios and most HTTP SDKs set `statusCode`, `status` or
// `response.status`. Non-number statuses are skipped so config branching on
// `statusCode` only ever compares against a number.
function readErrorCodes(node) {
  if (node === null || typeof node !== 'object') {
    return { code: undefined, statusCode: undefined };
  }
  const statusCode = [node.statusCode, node.status, node.response?.status].find(
    (value) => typeof value === 'number'
  );
  return { code: node.code, statusCode };
}

export default readErrorCodes;
