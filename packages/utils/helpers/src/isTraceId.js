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

const TRACE_ID_PATTERN = /^\d{8}T\d{6}Z-[a-z0-9]{6}$/;

// A trace id names a session or run file on disk, so this check is also the
// path-traversal guard for anything that builds a path from one.
function isTraceId(value) {
  return typeof value === 'string' && TRACE_ID_PATTERN.test(value);
}

export default isTraceId;
